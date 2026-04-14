// ===== FLOW COACH - Tu Asistente Financiero Inteligente =====

export type CoachPriority = 'critical' | 'warning' | 'tip' | 'positive'

export interface CoachAlert {
  id: string
  priority: CoachPriority
  emoji: string
  title: string
  message: string
  actionLabel?: string
  actionType?: string
  actionTarget?: string
  dismissible: boolean
  expiresAt?: number
}

export interface CoachSummary {
  totalAlerts: number
  criticalCount: number
  warningCount: number
  tipCount: number
  positiveCount: number
  topIssue: string | null
}

/**
 * FlowCoach — analiza tus finanzas y te habla claro.
 */
export function generateCoachAlerts(
  transactions: any[],
  debts: any[] = [],
  budgets: any[] = [],
  profile: {
    monthly_income?: number | null
    goal_type?: string
    currency?: string
    income_type?: string
  } = {}
): CoachAlert[] {
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()
  const alerts: CoachAlert[] = []
  const currency = profile.currency || 'MXN'

  // ===== DATOS DEL MES =====
  const thisMonth = transactions.filter((t: any) => {
    const d = new Date(t.date)
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear
  })
  const mIncome = thisMonth.filter((t: any) => t.type === 'income').reduce((s: number, t: any) => s + t.amount, 0)
  const mExpense = thisMonth.filter((t: any) => t.type === 'expense').reduce((s: number, t: any) => s + t.amount, 0)
  const balance = mIncome - mExpense
  const savingsRate = mIncome > 0 ? (balance / mIncome) * 100 : 0

  // ===== MESES ANTERIORES =====
  const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1
  const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear
  const lastMonth = transactions.filter((t: any) => {
    const d = new Date(t.date)
    return d.getMonth() === prevMonth && d.getFullYear() === prevYear
  })
  const lastExpense = lastMonth.filter((t: any) => t.type === 'expense').reduce((s: number, t: any) => s + t.amount, 0)

  // ===== GENERALES =====
  const refIncome = profile.monthly_income || mIncome || lastMonth.filter((t: any) => t.type === 'income').reduce((s: number, t: any) => s + t.amount, 0)
  const totalDebt = debts.filter((d: any) => d.status === 'active').reduce((s: number, d: any) => s + (d.total_amount - d.paid_amount), 0)

  // ===== CATEGORÍAS =====
  const catMap: Record<string, number> = {}
  thisMonth.filter((t: any) => t.type === 'expense').forEach((t: any) => {
    const name = getCategoryName(t.category_id)
    catMap[name] = (catMap[name] || 0) + t.amount
  })
  const topCat = Object.entries(catMap).sort((a, b) => b[1] - a[1])[0]
  const dailyAvg = mExpense / Math.max(1, now.getDate())

  // ==========================================
  // 🔴 CRÍTICO — Acciona YA
  // ==========================================

  if (balance < 0 && mIncome > 0) {
    alerts.push({
      id: 'negative_balance',
      priority: 'critical',
      emoji: '🚨',
      title: 'Estás gastando más de lo que ganas',
      message: `Este mes llevas ${formatCurrency(mExpense, currency)} en gastos y solo ${formatCurrency(mIncome, currency)} en ingresos. Si no frenas, cerrarás en rojo.`,
      actionLabel: 'Ver gastos',
      actionType: 'navigate',
      actionTarget: '/transactions',
      dismissible: false,
    })
  }

  if (mIncome > 0 && mExpense > 0 && now.getDate() > 3) {
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
    const projected = dailyAvg * daysInMonth
    if (projected > mIncome) {
      const dailyLimit = Math.max(0, (mIncome - mExpense) / Math.max(1, daysInMonth - now.getDate()))
      alerts.push({
        id: 'projection_negative',
        priority: 'critical',
        emoji: '📊',
        title: 'Proyección: cerrarás en negativo',
        message: `Al ritmo actual gastarás ~${formatCurrency(projected, currency)}. De aquí al final del mes, limita tus gastos a ${formatCurrency(dailyLimit, currency)} diarios.`,
        actionLabel: 'Revisar',
        actionType: 'navigate',
        actionTarget: '/transactions',
        dismissible: true,
      })
    }
  }

  const highInterestDebts = debts.filter((d: any) => d.status === 'active' && d.interest_rate >= 30)
  if (highInterestDebts.length > 0) {
    const names = highInterestDebts.map((d: any) => `${d.name} (${d.interest_rate}%)`).join(', ')
    alerts.push({
      id: 'high_interest_debts',
      priority: 'critical',
      emoji: '🔥',
      title: 'Deudas con interés peligroso',
      message: `${highInterestDebts.length} deuda(s) arriba del 30%: ${names}. Paga primero la de mayor tasa antes de que crezca más.`,
      actionLabel: 'Ir a deudas',
      actionType: 'navigate',
      actionTarget: '/debts',
      dismissible: false,
    })
  }

  if (totalDebt > refIncome * 3 && refIncome > 0) {
    alerts.push({
      id: 'debt_overwhelming',
      priority: 'critical',
      emoji: '💳',
      title: 'Tu deuda supera 3 meses de ingreso',
      message: `Debes ${formatCurrency(totalDebt, currency)}. Necesitas un plan urgente para no hundirte más.`,
      actionLabel: 'Ver deudas',
      actionType: 'navigate',
      actionTarget: '/debts',
      dismissible: true,
    })
  }

  budgets.forEach((b: any) => {
    const catExpense = thisMonth.filter((t: any) => t.type === 'expense' && t.category_id === b.category_id).reduce((s: number, t: any) => s + t.amount, 0)
    if (catExpense > b.amount * 1.3) {
      const catName = getCategoryName(b.category_id)
      alerts.push({
        id: `budget_exceeded_${b.category_id}`,
        priority: 'critical',
        emoji: '⛔',
        title: `Presupuesto de ${catName} excedido`,
        message: `Llevas ${formatCurrency(catExpense, currency)} de ${formatCurrency(b.amount, currency)}. Te pasaste por ${formatCurrency(catExpense - b.amount, currency)}.`,
        actionLabel: 'Detalles',
        actionType: 'navigate',
        actionTarget: '/budgets',
        dismissible: true,
      })
    }
  })

  // ==========================================
  // 🟡 ADVERTENCIA — Ojo con esto
  // ==========================================

  if (lastExpense > 0) {
    const change = ((mExpense - lastExpense) / lastExpense) * 100
    if (change > 25) {
      alerts.push({
        id: 'expenses_rising',
        priority: 'warning',
        emoji: '📈',
        title: `Gastos subieron ${change.toFixed(0)}% vs mes pasado`,
        message: `Pasaste de ${formatCurrency(lastExpense, currency)} a ${formatCurrency(mExpense, currency)}. Revisa qué categoría está creciendo.`,
        actionLabel: 'Analizar',
        actionType: 'navigate',
        actionTarget: '/reports',
        dismissible: true,
      })
    }
  }

  if (topCat && mExpense > 0) {
    const pct = (topCat[1] / mExpense) * 100
    if (pct > 35) {
      const saving = topCat[1] * 0.2
      alerts.push({
        id: 'dominant_category',
        priority: 'warning',
        emoji: '🔍',
        title: `${topCat[0]} se come el ${pct.toFixed(0)}% de tus gastos`,
        message: `Destinas ${formatCurrency(topCat[1], currency)} a ${topCat[0].toLowerCase()}. Si reduces un 20%, ahorras ${formatCurrency(saving, currency)} este mes.`,
        dismissible: true,
      })
    }
  }

  const foodExpense = thisMonth.filter((t: any) => t.type === 'expense' && ['food', 'restaurant', 'super'].includes(t.category_id || '')).reduce((s: number, t: any) => s + t.amount, 0)
  if (foodExpense > refIncome * 0.35 && refIncome > 0) {
    alerts.push({
      id: 'high_food_expense',
      priority: 'warning',
      emoji: '🍽️',
      title: 'Tu gasto en comida es alto',
      message: `${formatCurrency(foodExpense, currency)} en comida (${((foodExpense / refIncome) * 100).toFixed(0)}% de ingresos). Cocinar en casa te puede ahorrar hasta 40%.`,
      dismissible: true,
    })
  }

  const subsExpense = thisMonth.filter((t: any) => t.type === 'expense' && t.category_id === 'subs').reduce((s: number, t: any) => s + t.amount, 0)
  if (subsExpense > 300) {
    alerts.push({
      id: 'high_subscriptions',
      priority: 'warning',
      emoji: '🔄',
      title: `${formatCurrency(subsExpense, currency)} en suscripciones`,
      message: `Revisa cuáles usas de verdad. Cancelar las que no necesitas te ahorra dinero cada mes.`,
      dismissible: true,
    })
  }

  if (thisMonth.length > 0) {
    const sorted = [...thisMonth].sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
    const lastTx = sorted[0]
    const daysSince = Math.floor((now.getTime() - new Date(lastTx.date).getTime()) / 86400000)
    if (daysSince >= 3) {
      alerts.push({
        id: 'no_recent_activity',
        priority: 'warning',
        emoji: '📝',
        title: `${daysSince} días sin registrar`,
        message: `Tu último registro fue el ${formatDate(lastTx.date)}. Anota los pendientes para ver el panorama real.`,
        actionLabel: 'Agregar',
        actionType: 'add',
        actionTarget: 'expense',
        dismissible: true,
      })
    }
  }

  if (refIncome > 0 && dailyAvg > refIncome / 20) {
    alerts.push({
      id: 'high_daily_spending',
      priority: 'warning',
      emoji: '💰',
      title: `Gastas ${formatCurrency(dailyAvg, currency)} al día en promedio`,
      message: `Lo recomendado es ${formatCurrency(refIncome / 20, currency)} diarios. Vas por encima.`,
      dismissible: true,
    })
  }

  // ==========================================
  // 🟢 POSITIVO — Vas bien
  // ==========================================

  if (savingsRate >= 20 && mIncome > 0) {
    alerts.push({
      id: 'good_savings',
      priority: 'positive',
      emoji: '🎉',
      title: `¡Vas bien! Ahorras el ${savingsRate.toFixed(0)}%`,
      message: `Este mes ahorraste ${formatCurrency(balance, currency)}. Excelente control financiero.`,
      dismissible: true,
    })
  } else if (savingsRate >= 10 && mIncome > 0) {
    alerts.push({
      id: 'decent_savings',
      priority: 'positive',
      emoji: '👍',
      title: `Ahorras el ${savingsRate.toFixed(0)}% — buen camino`,
      message: `Si subes al 20%, este mes ahorrarías ${formatCurrency(mIncome * 0.2, currency)} en vez de ${formatCurrency(balance, currency)}.`,
      dismissible: true,
    })
  }

  if (lastExpense > 0 && mExpense > 0) {
    const change = ((mExpense - lastExpense) / lastExpense) * 100
    if (change < -15) {
      alerts.push({
        id: 'expenses_falling',
        priority: 'positive',
        emoji: '📉',
        title: `¡Reduciste gastos ${Math.abs(change).toFixed(0)}%!`,
        message: `Pasaste de ${formatCurrency(lastExpense, currency)} a ${formatCurrency(mExpense, currency)}. Gran mejora.`,
        dismissible: true,
      })
    }
  }

  const paidDebts = debts.filter((d: any) => d.status === 'paid')
  if (paidDebts.length > 0) {
    const recentPaid = paidDebts.filter((d: any) => {
      const d2 = new Date(d.updated_at || d.created_at)
      return d2.getMonth() === currentMonth && d2.getFullYear() === currentYear
    })
    if (recentPaid.length > 0) {
      alerts.push({
        id: 'debt_paid',
        priority: 'positive',
        emoji: '🏆',
        title: `¡Liquidaste ${recentPaid.length} deuda(s)!`,
        message: recentPaid.map((d: any) => d.name).join(', ') + '. Un paso más hacia tu libertad financiera.',
        dismissible: true,
      })
    }
  }

  if (transactions.length === 1) {
    alerts.push({
      id: 'first_transaction',
      priority: 'positive',
      emoji: '🌟',
      title: '¡Primer registro!',
      message: 'Ya empezaste a controlar tus finanzas. Cada registro cuenta.',
      dismissible: true,
    })
  }

  if (transactions.length === 10) {
    alerts.push({
      id: 'milestone_10',
      priority: 'positive',
      emoji: '⭐',
      title: '¡10 movimientos registrados!',
      message: 'Tu constancia genera datos cada vez más precisos.',
      dismissible: true,
    })
  }

  if (transactions.length === 50) {
    alerts.push({
      id: 'milestone_50',
      priority: 'positive',
      emoji: '🏅',
      title: '¡50 movimientos!',
      message: 'Ya tienes un historial sólido. FlowCoach puede darte consejos más precisos.',
      dismissible: true,
    })
  }

  // ==========================================
  // 💡 TIPS — Según tu objetivo
  // ==========================================

  if (transactions.length > 0) {
    if (profile.goal_type === 'save' && refIncome > 0) {
      const emergencyFund = refIncome * 3
      alerts.push({
        id: 'emergency_fund_tip',
        priority: 'tip',
        emoji: '🛡️',
        title: 'Tu fondo de emergencia ideal',
        message: `Necesitas ${formatCurrency(emergencyFund, currency)} (3 meses de ingreso). ${balance > 0 ? `Este mes ahorraste ${formatCurrency(balance, currency)}, vas por buen camino.` : 'Empieza con al menos el 10% de tu ingreso.'}`,
        dismissible: true,
      })
    }

    const activeDebts = debts.filter((d: any) => d.status === 'active')
    if (profile.goal_type === 'debt_control' && activeDebts.length > 0) {
      const sortedDebts = [...activeDebts].sort((a: any, b: any) => b.interest_rate - a.interest_rate)
      const target = sortedDebts[0]
      alerts.push({
        id: 'debt_strategy_tip',
        priority: 'tip',
        emoji: '💡',
        title: `Prioriza: ${target.name}`,
        message: `Con ${target.interest_rate}% de interés, es tu deuda más cara. Cada peso extra aquí te ahorra más a largo plazo.`,
        actionLabel: 'Ver deudas',
        actionType: 'navigate',
        actionTarget: '/debts',
        dismissible: true,
      })
    }

    if (profile.goal_type === 'expense_control' && topCat) {
      alerts.push({
        id: 'expense_control_tip',
        priority: 'tip',
        emoji: '📊',
        title: `Tu mayor gasto: ${topCat[0]}`,
        message: `${topCat[0]} es el ${mExpense > 0 ? ((topCat[1] / mExpense) * 100).toFixed(0) : 0}% de tus gastos. Enfócate en reducir esta categoría.`,
        dismissible: true,
      })
    }
  }

  // Si no hay transacciones aún
  if (transactions.length === 0) {
    alerts.push({
      id: 'welcome',
      priority: 'tip',
      emoji: '👋',
      title: '¡Bienvenido a FlowFin!',
      message: 'Registra tu primer ingreso o gasto para que empiece a analizar tus finanzas y darte consejos.',
      actionLabel: 'Registrar',
      actionType: 'add',
      actionTarget: 'expense',
      dismissible: false,
    })
  }

  // ==========================================
  // ORDEN: críticos primero
  // ==========================================
  const priorityOrder: Record<CoachPriority, number> = { critical: 0, warning: 1, tip: 2, positive: 3 }
  alerts.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])

  return alerts
}

// ===== HELPERS =====
function formatCurrency(n: number, currency = 'MXN'): string {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency, minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n)
}

function formatDate(d: string): string {
  return new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short' }).format(new Date(d))
}

function getCategoryName(id?: string): string {
  const cats: Record<string, string> = {
    food: 'Comida', transport: 'Transporte', home: 'Vivienda', fun: 'Ocio',
    health: 'Salud', edu: 'Educación', clothes: 'Ropa', services: 'Servicios',
    subs: 'Suscripciones', restaurant: 'Restaurantes', super: 'Supermercado',
    gas: 'Gasolina', beauty: 'Belleza', gifts: 'Regalos', pets: 'Mascotas',
    other_expense: 'Otros Gastos', salary: 'Salario', freelance: 'Freelance',
    business: 'Negocio', invest: 'Inversiones', sales: 'Ventas', other_income: 'Otros Ingresos',
  }
  return cats[id || ''] || 'Sin categoría'
}

export function getCoachSummary(alerts: CoachAlert[]): CoachSummary {
  return {
    totalAlerts: alerts.length,
    criticalCount: alerts.filter(a => a.priority === 'critical').length,
    warningCount: alerts.filter(a => a.priority === 'warning').length,
    tipCount: alerts.filter(a => a.priority === 'tip').length,
    positiveCount: alerts.filter(a => a.priority === 'positive').length,
    topIssue: alerts.find(a => a.priority === 'critical')?.title || null,
  }
}
