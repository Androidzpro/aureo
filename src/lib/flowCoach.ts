// ===== FLOW COACH - Sistema Inteligente de Asesoría Financiera =====

export type CoachPriority = 'critical' | 'warning' | 'tip' | 'positive'

export interface CoachAlert {
  id: string
  priority: CoachPriority
  emoji: string
  title: string
  message: string
  actionLabel?: string
  actionType?: string // 'navigate' | 'add' | 'dismiss'
  actionTarget?: string
  dismissible: boolean
  expiresAt?: number // timestamp when this alert expires (0 = no expiry)
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
 * FlowCoach - Motor de análisis financiero inteligente
 *
 * Analiza transacciones, deudas, presupuestos y genera insights accionables.
 * Cada insight tiene prioridad, título, mensaje y acción sugerida.
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
  const thisMonth = transactions.filter(t => {
    const d = new Date(t.date)
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear
  })
  const mIncome = thisMonth.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const mExpense = thisMonth.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const balance = mIncome - mExpense
  const savingsRate = mIncome > 0 ? (balance / mIncome) * 100 : 0

  // ===== DATOS DE MESES ANTERIORES =====
  const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1
  const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear
  const lastMonth = transactions.filter(t => {
    const d = new Date(t.date)
    return d.getMonth() === prevMonth && d.getFullYear() === prevYear
  })
  const lastIncome = lastMonth.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const lastExpense = lastMonth.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)

  // ===== DATOS GENERALES =====
  const refIncome = profile.monthly_income || mIncome || lastIncome
  const totalDebt = debts.filter(d => d.status === 'active').reduce((s, d) => s + (d.total_amount - d.paid_amount), 0)
  const activeDebtCount = debts.filter(d => d.status === 'active').length

  // ===== CATEGORÍAS =====
  const catMap: Record<string, number> = {}
  thisMonth.filter(t => t.type === 'expense').forEach(t => {
    const name = getCategoryName(t.category_id)
    catMap[name] = (catMap[name] || 0) + t.amount
  })
  const topCat = Object.entries(catMap).sort((a, b) => b[1] - a[1])[0]
  const dailyAvg = thisMonth.filter(t => t.type === 'expense').length > 0
    ? mExpense / Math.max(1, now.getDate())
    : 0

  // ==========================================
  // 1. ALERTAS CRÍTICAS
  // ==========================================

  // Balance negativo este mes
  if (balance < 0 && mIncome > 0) {
    alerts.push({
      id: 'negative_balance',
      priority: 'critical',
      emoji: '🚨',
      title: 'Estás en números rojos este mes',
      message: `Has gastado ${formatCurrency(Math.abs(balance), currency)} más de lo que ganaste. Si no corriges, cerrarás el mes con déficit.`,
      actionLabel: 'Ver movimientos',
      actionType: 'navigate',
      actionTarget: '/transactions',
      dismissible: false,
    })
  }

  // Proyección negativa de fin de mes
  if (mIncome > 0 && mExpense > 0 && now.getDate() > 3) {
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
    const daysElapsed = now.getDate()
    const projected = (dailyAvg * daysInMonth)
    if (projected > mIncome) {
      const dailyLimit = Math.max(0, (mIncome - mExpense) / Math.max(1, daysInMonth - daysElapsed))
      alerts.push({
        id: 'projection_negative',
        priority: 'critical',
        emoji: '📊',
        title: 'Proyección: cerrarás en negativo',
        message: `Al ritmo actual, gastarás ~${formatCurrency(projected, currency)} este mes. Para no pasarte, limita tus gastos a ${formatCurrency(dailyLimit, currency)} diarios de aquí al final.`,
        actionLabel: 'Revisar gastos',
        actionType: 'navigate',
        actionTarget: '/transactions',
        dismissible: true,
      })
    }
  }

  // Deudas con interés alto
  const highInterestDebts = debts.filter(d => d.status === 'active' && d.interest_rate >= 30)
  if (highInterestDebts.length > 0) {
    const names = highInterestDebts.map(d => `${d.name} (${d.interest_rate}%)`).join(', ')
    alerts.push({
      id: 'high_interest_debts',
      priority: 'critical',
      emoji: '🔥',
      title: 'Deudas con interés peligroso',
      message: `${highInterestDebts.length} deuda(s) con 30%+ de interés: ${names}. Cada día que pasa crecen exponencialmente. Paga primero la de mayor tasa.`,
      actionLabel: 'Ir a deudas',
      actionType: 'navigate',
      actionTarget: '/debts',
      dismissible: false,
    })
  }

  // Deuda total > 3x ingreso mensual
  if (totalDebt > refIncome * 3 && refIncome > 0) {
    const months = (totalDebt / refIncome).toFixed(1)
    alerts.push({
      id: 'debt_overwhelming',
      priority: 'critical',
      emoji: '💳',
      title: 'Tu deuda es más de 3 meses de ingreso',
      message: `Debes ${formatCurrency(totalDebt, currency)}, equivalente a ${months} meses de ingreso. Necesitas un plan de acción urgente.`,
      actionLabel: 'Ver plan',
      actionType: 'navigate',
      actionTarget: '/debts',
      dismissible: true,
    })
  }

  // Presupuesto muy excedido
  budgets.forEach(b => {
    const catExpense = thisMonth.filter(t => t.type === 'expense' && t.category_id === b.category_id).reduce((s, t) => s + t.amount, 0)
    if (catExpense > b.amount * 1.3) {
      const catName = getCategoryName(b.category_id)
      alerts.push({
        id: `budget_exceeded_${b.category_id}`,
        priority: 'critical',
        emoji: '⛔',
        title: `Presupuesto de ${catName} excedido en ${((catExpense / b.amount - 1) * 100).toFixed(0)}%`,
        message: `Llevas ${formatCurrency(catExpense, currency)} de ${formatCurrency(b.amount, currency)}. Te pasaste por ${formatCurrency(catExpense - b.amount, currency)}.`,
        actionLabel: 'Ver detalles',
        actionType: 'navigate',
        actionTarget: '/budgets',
        dismissible: true,
      })
    }
  })

  // ==========================================
  // 2. ALERTAS DE ADVERTENCIA
  // ==========================================

  // Gastos crecientes vs mes anterior
  if (lastExpense > 0) {
    const change = ((mExpense - lastExpense) / lastExpense) * 100
    if (change > 25) {
      alerts.push({
        id: 'expenses_rising',
        priority: 'warning',
        emoji: '📈',
        title: `Gastos subieron ${change.toFixed(0)}% vs mes pasado`,
        message: `Pasaste de ${formatCurrency(lastExpense, currency)} a ${formatCurrency(mExpense, currency)}. Identifica qué categorías están creciendo.`,
        actionLabel: 'Analizar',
        actionType: 'navigate',
        actionTarget: '/reports',
        dismissible: true,
      })
    }
  }

  // Sin ingresos registrados este mes
  if (mIncome === 0 && transactions.filter(t => t.type === 'income').length > 0) {
    alerts.push({
      id: 'no_income_this_month',
      priority: 'warning',
      emoji: '💸',
      title: 'No has registrado ingresos este mes',
      message: `Si no ingresas dinero pronto, tu balance será negativo. ¿Olvidaste registrar algún ingreso?`,
      actionLabel: 'Agregar ingreso',
      actionType: 'add',
      actionTarget: 'income',
      dismissible: true,
    })
  }

  // Categoría dominante
  if (topCat && mExpense > 0) {
    const pct = (topCat[1] / mExpense) * 100
    if (pct > 35) {
      const saving = topCat[1] * 0.2
      alerts.push({
        id: 'dominant_category',
        priority: 'warning',
        emoji: '🔍',
        title: `${topCat[0]} consume el ${pct.toFixed(0)}% de tus gastos`,
        message: `Destinas ${formatCurrency(topCat[1], currency)} a ${topCat[0].toLowerCase()}. Si reduces un 20%, ahorrarías ${formatCurrency(saving, currency)}.`,
        dismissible: true,
      })
    }
  }

  // Gasto en comida alto
  const foodExpense = thisMonth.filter(t => t.type === 'expense' && ['food', 'restaurant', 'super'].includes(t.category_id || '')).reduce((s, t) => s + t.amount, 0)
  if (foodExpense > refIncome * 0.35 && refIncome > 0) {
    alerts.push({
      id: 'high_food_expense',
      priority: 'warning',
      emoji: '🍽️',
      title: 'Gasto en alimentación alto',
      message: `Destinas ${formatCurrency(foodExpense, currency)} a comida (${((foodExpense / refIncome) * 100).toFixed(0)}% de ingresos). Cocinar en casa puede ahorrarte hasta 40%.`,
      dismissible: true,
    })
  }

  // Suscripciones excesivas
  const subsExpense = thisMonth.filter(t => t.type === 'expense' && t.category_id === 'subs').reduce((s, t) => s + t.amount, 0)
  if (subsExpense > 300) {
    alerts.push({
      id: 'high_subscriptions',
      priority: 'warning',
      emoji: '🔄',
      title: `${formatCurrency(subsExpense, currency)} en suscripciones`,
      message: `Revisa si realmente usas todas. Cancelar las que no usas te ahorraría dinero cada mes.`,
      dismissible: true,
    })
  }

  // Sin registrar movimientos hace 3+ días
  if (thisMonth.length > 0) {
    const sorted = [...thisMonth].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    const lastTx = sorted[0]
    const daysSince = Math.floor((now.getTime() - new Date(lastTx.date).getTime()) / 86400000)
    if (daysSince >= 3) {
      alerts.push({
        id: 'no_recent_activity',
        priority: 'warning',
        emoji: '📝',
        title: `${daysSince} días sin registrar movimientos`,
        message: `Tu último registro fue el ${formatDate(lastTx.date)}. Anota los pendientes para tener un panorama real.`,
        actionLabel: 'Agregar movimiento',
        actionType: 'add',
        actionTarget: 'expense',
        dismissible: true,
      })
    }
  }

  // Gasto diario alto
  if (refIncome > 0 && dailyAvg > refIncome / 20) {
    alerts.push({
      id: 'high_daily_spending',
      priority: 'warning',
      emoji: '💰',
      title: `Promedio de ${formatCurrency(dailyAvg, currency)} por día`,
      message: `Tu gasto diario supera lo recomendado (${formatCurrency(refIncome / 20, currency)}). Intenta mantenerte por debajo.`,
      dismissible: true,
    })
  }

  // ==========================================
  // 3. ALERTAS POSITIVAS
  // ==========================================

  // Buen ahorro
  if (savingsRate >= 20 && mIncome > 0) {
    alerts.push({
      id: 'good_savings',
      priority: 'positive',
      emoji: '🎉',
      title: `¡Ahorras el ${savingsRate.toFixed(0)}% este mes!`,
      message: `Excelente control. Has ahorrado ${formatCurrency(balance, currency)}. ¡Sigue así!`,
      dismissible: true,
    })
  }

  // Gastos bajando
  if (lastExpense > 0 && mExpense > 0) {
    const change = ((mExpense - lastExpense) / lastExpense) * 100
    if (change < -15) {
      alerts.push({
        id: 'expenses_falling',
        priority: 'positive',
        emoji: '📉',
        title: `¡Reduciste gastos ${Math.abs(change).toFixed(0)}%!`,
        message: `Pasaste de ${formatCurrency(lastExpense, currency)} a ${formatCurrency(mExpense, currency)}. Gran mejora en tu control financiero.`,
        dismissible: true,
      })
    }
  }

  // Deuda pagada este mes
  const paidDebts = debts.filter(d => d.status === 'paid')
  if (paidDebts.length > 0) {
    const recentPaid = paidDebts.filter(d => {
      const d2 = new Date(d.updated_at || d.created_at)
      return d2.getMonth() === currentMonth && d2.getFullYear() === currentYear
    })
    if (recentPaid.length > 0) {
      alerts.push({
        id: 'debt_paid',
        priority: 'positive',
        emoji: '🏆',
        title: `¡Eliminaste ${recentPaid.length} deuda(s) este mes!`,
        message: recentPaid.map(d => d.name).join(', ') + '. Excelente trabajo, estás avanzando hacia tu libertad financiera.',
        dismissible: true,
      })
    }
  }

  // Primer registro
  if (transactions.length === 1) {
    alerts.push({
      id: 'first_transaction',
      priority: 'positive',
      emoji: '🌟',
      title: '¡Primer registro!',
      message: 'Comenzaste a controlar tus finanzas. Cada registro cuenta para mejorar tu FlowScore.',
      dismissible: true,
    })
  }

  // Hitos de registros
  if ([10, 25, 50, 100].includes(transactions.length) && transactions.length > 1) {
    alerts.push({
      id: `milestone_${transactions.length}`,
      priority: 'positive',
      emoji: '⭐',
      title: `¡${transactions.length} movimientos registrados!`,
      message: 'Tu constancia te da datos cada vez más precisos sobre tus finanzas.',
      dismissible: true,
    })
  }

  // Presupuesto bajo control
  budgets.forEach(b => {
    const catExpense = thisMonth.filter(t => t.type === 'expense' && t.category_id === b.category_id).reduce((s, t) => s + t.amount, 0)
    if (catExpense < b.amount * 0.5 && catExpense > 0) {
      const catName = getCategoryName(b.category_id)
      alerts.push({
        id: `budget_under_control_${b.category_id}`,
        priority: 'positive',
        emoji: '✅',
        title: `${catName} bajo control`,
        message: `Solo usaste ${formatCurrency(catExpense, currency)} de ${formatCurrency(b.amount, currency)} (${((catExpense / b.amount) * 100).toFixed(0)}%).`,
        dismissible: true,
      })
    }
  })

  // ==========================================
  // 4. TIPS PERSONALIZADOS (basados en goal_type)
  // ==========================================
  if (transactions.length > 0) {
    if (profile.goal_type === 'save' && refIncome > 0) {
      const emergencyFund = refIncome * 3
      const totalSavings = mIncome - mExpense // Simplificado
      alerts.push({
        id: 'emergency_fund_tip',
        priority: 'tip',
        emoji: '🛡️',
        title: 'Tu fondo de emergencia ideal',
        message: `Necesitas ${formatCurrency(emergencyFund, currency)} (3 meses de ingreso). ${totalSavings > 0 ? `Vas ${((totalSavings / emergencyFund) * 100).toFixed(0)}% del camino.` : 'Empieza ahorrando al menos el 10% de tu ingreso.'}`,
        dismissible: true,
      })
    }

    if (profile.goal_type === 'debt_control' && activeDebtCount > 0) {
      const sortedDebts = [...debts.filter(d => d.status === 'active')].sort((a, b) => b.interest_rate - a.interest_rate)
      const target = sortedDebts[0]
      alerts.push({
        id: 'debt_strategy_tip',
        priority: 'tip',
        emoji: '💡',
        title: `Estrategia: ataca primero ${target.name}`,
        message: `Con ${target.interest_rate}% de interés, es tu deuda más cara. Cada peso extra que pagues aquí te ahorra más a largo plazo.`,
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
        message: `Representa el ${mExpense > 0 ? ((topCat[1] / mExpense) * 100).toFixed(0) : 0}% de tus gastos (${formatCurrency(topCat[1], currency)}). Enfócate en reducir esta categoría primero.`,
        dismissible: true,
      })
    }
  }

  // ==========================================
  // ORDENAR POR PRIORIDAD
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
