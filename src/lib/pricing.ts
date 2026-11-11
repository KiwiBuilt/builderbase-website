export const EXTRA_USER_ADDON_COPY = 'Add extra users anytime at $25/user/month'

export type PricingPlan = {
  name: string
  badge?: string
  priceMonthly: number
  price: string
  period: string
  annualPrice: string
  annualSavings: string
  description: string
  users: number
  usersLabel: string
  activeProjects: string
  features: string[]
  /** Only Essential can be purchased in the live app today. */
  available: boolean
}

export const PLANS: PricingPlan[] = [
  {
    name: 'Essential',
    badge: 'Founding Member',
    priceMonthly: 69,
    price: '$69',
    period: '/month',
    annualPrice: '$750',
    annualSavings: 'Save 9% annually',
    description: 'Core job costing tools - Site Diaries, Change Orders, Timesheets & Invoicing',
    users: 5,
    usersLabel: '5 users',
    activeProjects: 'Unlimited',
    available: true,
    features: [
      'Jobs',
      'Tasks',
      'Files',
      'Financials',
      'Client Portal',
      'Invoicing',
      'Compliance',
      'Time Clock',
    ],
  },
  {
    name: 'Basic',
    badge: 'COMING SOON',
    priceMonthly: 149,
    price: '$149',
    period: '/month',
    annualPrice: '$1490',
    annualSavings: 'Save 17% annually',
    description: 'Essential features for small teams and independent contractors',
    users: 5,
    usersLabel: '5 users',
    activeProjects: 'Unlimited',
    available: false,
    features: [
      'Jobs',
      'Tasks',
      'Files',
      'Financials',
      'Client Portal',
      'Invoicing',
      'Basic Reporting',
      'Web Analytics',
      'Lead Forms',
      'Compliance',
      'Messaging',
      'Sales Pipeline',
      'Task Management',
    ],
  },
  {
    name: 'Professional',
    badge: 'COMING SOON',
    priceMonthly: 349,
    price: '$349',
    period: '/month',
    annualPrice: '$3490',
    annualSavings: 'Save 17% annually',
    description: 'Full-featured platform for growing construction teams',
    users: 25,
    usersLabel: '25 users',
    activeProjects: 'Unlimited',
    available: false,
    features: [
      'Jobs',
      'Tasks',
      'Files',
      'Financials',
      'Client Portal',
      'Invoicing',
      'Basic Reporting',
      'Web Analytics',
      'Lead Forms',
      'Compliance',
      'Messaging',
      'Sales Pipeline',
      'Staff Management',
      'Home Portal',
      'Leave Management',
      'Purchase Requests',
      'Certificate Tracking',
      'Vehicle Management',
      'Time Clock',
      'Advanced Reporting',
      'Job Map',
      'Past Jobs',
      'Job Schedule',
      'Selections',
      'Toolbox Talks',
      'PC Ps Register',
      'Task Management',
      'Process Checklists',
    ],
  },
]

const [essential, basic, professional] = PLANS

export const SITE_DESCRIPTION = `Construction management software for NZ builders. Essential is ${essential.price}/month and available now. Basic ${basic.price} and Professional ${professional.price} are coming soon. 14-day free trial, no credit card.`

export const PRICING_FAQ_ANSWER = `Essential is ${essential.price}/month and is the plan you can start today. Basic (${basic.price}/month) and Professional (${professional.price}/month) are coming soon and cannot be purchased yet. ${EXTRA_USER_ADDON_COPY}.`

export function trialPlan(): PricingPlan {
  return PLANS.find((plan) => plan.available) ?? essential
}
