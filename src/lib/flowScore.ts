// ===== FLOWSCORE - Algoritmo Avanzado de Salud Financiera =====

export interface FlowScoreBreakdown {
  savings_score: number      // 0-25 puntos
  expense_ratio_score: number // 0-20 puntos
  debt_score: number          // 0-20 puntos
  consistency_score: number   // 0-15 puntos
  trend_score: number         // 0-10 puntos
  emergency_score: number     // 0-10 puntos
}

export interface FlowScoreResult {
  score: number                    // 0-100
  level: 'excelente' | 'bueno' | 'regular' | 'riesgo' | 'crítico'
  color: string
  message: string
  breakdown: FlowScoreBreakdown
  recommendations: FlowRecommendation[]
}

export interface FlowRecommendation {
  priority: 'high' | 'medium' | 'low'
  icon: string
  title: string
  message: string
  impact: string  // "Mejora tu score hasta +X puntos"
}

/**
 * FlowScore - Algoritmo completo de evaluación financiera
 *
 * Analiza 6 dimensiones:
 * 1. Tasa de ahorro (25 pts) - Qué porcentaje ahorras
 * 2. Ratio gasto/ingreso (20 pts) - Control de gastos vs ingresos
 * 3. Carga de deuda (20 pts) - Deuda total vs ingreso mensual
 * 4. Consistencia (15 pts) - Frecuencia y regularidad de registros
 * 5. Tendencia (10 pts) - Dirección de tus gastos mes a mes
 * 6. Fondo de emergencia (10 pts) - Ahorro acumulado vs gastos mensuales
 */
export function calcFlowScore(
  transactions: any[],
  debts: any[] = [],
  monthlyIncome?: number | null,
  monthlyGoal?: string
): FlowScoreResult {
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()

  // Transacciones del mes actual
  const thisMonth = transactions.filter(t => {
    const d = new Date(t.date)
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear
  })

  // Últimos 6 meses para tendencias
  const last6Months: { income: number; expense: number; month: number; year: number }[] = []
  for (let i = 0; i < 6; i++) {
    const m = currentMonth - i < 0 ? currentMonth - i + 12 : currentMonth - i
    const y = currentMonth - i < 0 ? currentYear - 1 : currentYear
    const mTxs = transactions.filter(t => { const d = new Date(t.date); return d.getMonth() === m && d.getFullYear() === y })
    last6Months.push({
      month: m,
      year: y,
      income: mTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
      expense: mTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
    })
  }
  last6Months.reverse()

  const mIncome = thisMonth.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const mExpense = thisMonth.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const totalIncome = last6Months.reduce((s, m) => s + m.income, 0)
  const totalExpense = last6Months.reduce((s, m) => s + m.expense, 0)

  // Ingreso de referencia (onboarding o promedio 6 meses)
  const refIncome = monthlyIncome || (last6Months.filter(m => m.income > 0).length > 0
    ? last6Months.filter(m => m.income > 0).reduce((s, m) => s + m.income, 0) / last6Months.filter(m => m.income > 0).length
    : 0)

  // Deuda activa total
  const activeDebts = debts.filter(d => d.status === 'active')
  const totalDebt = activeDebts.reduce((s, d) => s + (d.total_amount - d.paid_amount), 0)
  const totalPaid = debts.reduce((s, d) => s + d.paid_amount, 0)

  // Ahorro acumulado (todos los ingresos - todos los gastos - deudas pagadas)
  const totalSavings = Math.max(0, totalIncome - totalExpense - totalPaid)
  const avgMonthlyExpense = last6Months.filter(m => m.expense > 0).length > 0
    ? last6Months.filter(m => m.expense > 0).reduce((s, m) => s + m.expense, 0) / last6Months.filter(m => m.expense > 0).length
    : 0

  // ==========================================
  // 1. TASA DE AHORRO (0-25 puntos)
  // ==========================================
  const savingsRate = refIncome > 0 ? ((refIncome - mExpense) / refIncome) * 100 : 0
  let savings_score = 0
  if (refIncome > 0) {
    if (savingsRate >= 40) savings_score = 25
    else if (savingsRate >= 30) savings_score = 22
    else if (savingsRate >= 20) savings_score = 18
    else if (savingsRate >= 15) savings_score = 14
    else if (savingsRate >= 10) savings_score = 10
    else if (savingsRate >= 5) savings_score = 6
    else if (savingsRate >= 0) savings_score = 3
    else if (savingsRate >= -10) savings_score = 1
    else savings_score = 0
  }

  // ==========================================
  // 2. RATIO GASTO/INGRESO (0-20 puntos)
  // ==========================================
  const expenseRatio = refIncome > 0 ? (mExpense / refIncome) * 100 : 100
  let expense_ratio_score = 0
  if (refIncome > 0) {
    if (expenseRatio <= 50) expense_ratio_score = 20
    else if (expenseRatio <= 60) expense_ratio_score = 17
    else if (expenseRatio <= 70) expense_ratio_score = 14
    else if (expenseRatio <= 80) expense_ratio_score = 10
    else if (expenseRatio <= 90) expense_ratio_score = 6
    else if (expenseRatio <= 100) expense_ratio_score = 3
    else expense_ratio_score = 0
  }

  // ==========================================
  // 3. CARGA DE DEUDA (0-20 puntos)
  // ==========================================
  const debtRatio = refIncome > 0 ? (totalDebt / refIncome) * 100 : 0
  let debt_score = 0
  if (refIncome > 0) {
    if (totalDebt === 0) debt_score = 20
    else if (debtRatio <= 25) debt_score = 16
    else if (debtRatio <= 50) debt_score = 12
    else if (debtRatio <= 100) debt_score = 7
    else if (debtRatio <= 200) debt_score = 3
    else debt_score = 0
  }

  // Bono por pagos de deuda este mes
  const thisMonthDebtPayments = activeDebts.length > 0
    ? debts.filter(d => d.status === 'active').length
    : 0
  if (thisMonthDebtPayments > 0 && totalDebt > 0) debt_score = Math.min(20, debt_score + 2)

  // ==========================================
  // 4. CONSISTENCIA (0-15 puntos)
  // ==========================================
  const totalTxCount = transactions.length
  const thisMonthTxCount = thisMonth.length
  const monthsWithActivity = last6Months.filter(m => m.income > 0 || m.expense > 0).length

  let consistency_score = 0
  // Actividad regular (0-8 pts)
  if (monthsWithActivity >= 6) consistency_score = 8
  else if (monthsWithActivity >= 4) consistency_score = 6
  else if (monthsWithActivity >= 2) consistency_score = 3
  else if (monthsWithActivity >= 1) consistency_score = 1

  // Registros este mes (0-4 pts)
  if (thisMonthTxCount >= 15) consistency_score += 4
  else if (thisMonthTxCount >= 8) consistency_score += 3
  else if (thisMonthTxCount >= 3) consistency_score += 2
  else if (thisMonthTxCount >= 1) consistency_score += 1

  // Diversidad de categorías (0-3 pts)
  const uniqueCategories = new Set(thisMonth.filter(t => t.category_id).map(t => t.category_id)).size
  if (uniqueCategories >= 5) consistency_score += 3
  else if (uniqueCategories >= 3) consistency_score += 2
  else if (uniqueCategories >= 1) consistency_score += 1

  // ==========================================
  // 5. TENDENCIA MENSUAL (0-10 puntos)
  // ==========================================
  let trend_score = 5 // Neutral por defecto

  const monthsWithData = last6Months.filter(m => m.expense > 0)
  if (monthsWithData.length >= 2) {
    // Calcular pendiente de gastos (últimos 3 meses con datos)
    const recent3 = monthsWithData.slice(-3)
    if (recent3.length >= 2) {
      const first = recent3[0].expense
      const last = recent3[recent3.length - 1].expense
      const changePct = first > 0 ? ((last - first) / first) * 100 : 0

      if (changePct <= -20) trend_score = 10  // Bajando mucho
      else if (changePct <= -10) trend_score = 8
      else if (changePct <= 0) trend_score = 7  // Estable o bajando poco
      else if (changePct <= 10) trend_score = 5  // Subiendo poco
      else if (changePct <= 20) trend_score = 3
      else trend_score = 1  // Subiendo mucho
    }

    // Bono si los ingresos son estables o crecientes
    const incomeMonths = last6Months.filter(m => m.income > 0)
    if (incomeMonths.length >= 3) {
      const incomeChange = incomeMonths[0].income > 0
        ? ((incomeMonths[incomeMonths.length - 1].income - incomeMonths[0].income) / incomeMonths[0].income) * 100
        : 0
      if (incomeChange > 0) trend_score = Math.min(10, trend_score + 2)
    }
  }

  // ==========================================
  // 6. FONDO DE EMERGENCIA (0-10 puntos)
  // ==========================================
  let emergency_score = 0
  if (avgMonthlyExpense > 0) {
    const monthsOfExpenses = totalSavings / avgMonthlyExpense
    if (monthsOfExpenses >= 6) emergency_score = 10
    else if (monthsOfExpenses >= 3) emergency_score = 8
    else if (monthsOfExpenses >= 2) emergency_score = 6
    else if (monthsOfExpenses >= 1) emergency_score = 4
    else if (monthsOfExpenses >= 0.5) emergency_score = 2
    else emergency_score = 0
  } else if (totalSavings > 0) {
    emergency_score = 5 // Tiene ahorro pero sin gastos de referencia
  }

  // ==========================================
  // SCORE FINAL
  // ==========================================
  const score = savings_score + expense_ratio_score + debt_score + consistency_score + trend_score + emergency_score
  const finalScore = Math.min(Math.max(score, 0), 100)

  // ==========================================
  // NIVEL Y MENSAJE
  // ==========================================
  let level: FlowScoreResult['level']
  let color: string
  let message: string

  if (finalScore >= 80) {
    level = 'excelente'
    color = '#10B981'
    message = '¡Tus finanzas están en excelente estado! Mantén este ritmo.'
  } else if (finalScore >= 60) {
    level = 'bueno'
    color = '#06B6D4'
    message = 'Tus finanzas van bien, pero hay áreas de mejora.'
  } else if (finalScore >= 40) {
    level = 'regular'
    color = '#F59E0B'
    message = 'Tus finanzas necesitan atención. Hay riesgos que debes atender.'
  } else if (finalScore >= 20) {
    level = 'riesgo'
    color = '#F97316'
    message = 'Tus finanzas están en riesgo. Es urgente tomar acción.'
  } else {
    level = 'crítico'
    color = '#EF4444'
    message = 'Situación financiera crítica. Necesitas un plan de acción inmediato.'
  }

  // ==========================================
  // RECOMENDACIONES DINÁMICAS
  // ==========================================
  const recommendations: FlowRecommendation[] = []

  // Basadas en el breakdown
  if (savings_score < 10 && refIncome > 0) {
    const target = refIncome * 0.2
    recommendations.push({
      priority: 'high',
      icon: '🎯',
      title: 'Aumenta tu tasa de ahorro',
      message: `Actualmente ahorras ${savingsRate.toFixed(0)}% de tus ingresos. Lo recomendado es al menos 20% (${formatCurrencyHelper(target)}).`,
      impact: 'Mejora tu score hasta +8 puntos',
    })
  }

  if (expense_ratio_score < 10 && refIncome > 0) {
    const over = mExpense - refIncome * 0.7
    recommendations.push({
      priority: 'high',
      icon: '📉',
      title: 'Reduce gastos innecesarios',
      message: `Tus gastos representan ${expenseRatio.toFixed(0)}% de tus ingresos. Intenta reducir ${formatCurrencyHelper(Math.max(0, over))} para estar en zona segura.`,
      impact: 'Mejora tu score hasta +7 puntos',
    })
  }

  if (debt_score < 10 && totalDebt > 0) {
    const highInterest = activeDebts.filter(d => d.interest_rate > 20)
    recommendations.push({
      priority: highInterest.length > 0 ? 'high' : 'medium',
      icon: '💳',
      title: `Prioriza pagar ${highInterest.length > 0 ? 'deudas de alto interés' : 'tus deudas'}`,
      message: highInterest.length > 0
        ? `Tienes ${highInterest.length} deuda(s) con más del 20% de interés. El costo total estimado es ${formatCurrencyHelper(totalDebt)}.`
        : `Tu deuda total es ${formatCurrencyHelper(totalDebt)}, equivalente a ${(debtRatio / 100).toFixed(1)} meses de ingreso.`,
      impact: 'Mejora tu score hasta +8 puntos',
    })
  }

  if (consistency_score < 8) {
    recommendations.push({
      priority: 'medium',
      icon: '📝',
      title: 'Registra tus movimientos con regularidad',
      message: monthsWithActivity < 3
        ? 'Llevas menos de 3 meses con actividad. La constancia ayuda a FlowFin a darte mejores recomendaciones.'
        : 'Registra al menos 3 movimientos por semana para un análisis más preciso.',
      impact: 'Mejora tu score hasta +5 puntos',
    })
  }

  if (trend_score < 5 && monthsWithData.length >= 2) {
    recommendations.push({
      priority: 'medium',
      icon: '📊',
      title: 'Tus gastos van en aumento',
      message: 'En los últimos meses, tus gastos han subido constantemente. Identifica qué categorías están creciendo.',
      impact: 'Mejora tu score hasta +4 puntos',
    })
  }

  if (emergency_score < 5) {
    const emergencyTarget = avgMonthlyExpense * 3
    recommendations.push({
      priority: avgMonthlyExpense > 0 ? 'high' : 'low',
      icon: '🛡️',
      title: 'Crea un fondo de emergencia',
      message: avgMonthlyExpense > 0
        ? `Necesitas al menos ${formatCurrencyHelper(emergencyTarget)} (3 meses de gastos) para estar protegido. Actualmente tienes ${formatCurrencyHelper(totalSavings)}.`
        : 'Registra tus gastos para que podamos calcular tu fondo de emergencia ideal.',
      impact: 'Mejora tu score hasta +5 puntos',
    })
  }

  // Recomendación positiva si todo está bien
  if (recommendations.length === 0) {
    recommendations.push({
      priority: 'low',
      icon: '🌟',
      title: '¡Excelente trabajo financiero!',
      message: 'Tus finanzas están en gran forma. Considera invertir el excedente para hacer crecer tu patrimonio.',
      impact: 'Mantén tu racha y sube aún más',
    })
  }

  return {
    score: finalScore,
    level,
    color,
    message,
    breakdown: { savings_score, expense_ratio_score, debt_score, consistency_score, trend_score, emergency_score },
    recommendations,
  }
}

function formatCurrencyHelper(n: number): string {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n)
}
