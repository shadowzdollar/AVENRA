import { NavGroup } from '@/types';

/**
 * Navigation configuration with RBAC support
 *
 * This configuration is used for both the sidebar navigation and Cmd+K bar.
 * Items are organized into groups, each rendered with a SidebarGroupLabel.
 *
 * RBAC Access Control:
 * Each navigation item can have an `access` property that controls visibility
 * based on permissions, plans, features, roles, and organization context.
 *
 * Examples:
 *
 * 1. Require organization:
 *    access: { requireOrg: true }
 *
 * 2. Require specific permission:
 *    access: { requireOrg: true, permission: 'org:teams:manage' }
 *
 * 3. Require specific plan:
 *    access: { plan: 'pro' }
 *
 * 4. Require specific feature:
 *    access: { feature: 'premium_access' }
 *
 * 5. Require specific role:
 *    access: { role: 'admin' }
 *
 * 6. Multiple conditions (all must be true):
 *    access: { requireOrg: true, permission: 'org:teams:manage', plan: 'pro' }
 *
 * Note: The `visible` function is deprecated but still supported for backward compatibility.
 * Use the `access` property for new items.
 */
export const navGroups: NavGroup[] = [
  {
    label: 'Work Execution',
    items: [
      {
        title: 'Command Center',
        url: '/dashboard/overview',
        icon: 'dashboard',
        isActive: false,
        shortcut: ['d', 'd'],
        items: []
      },
      {
        title: 'Execution Board',
        url: '/dashboard/kanban',
        icon: 'kanban',
        shortcut: ['k', 'k'],
        isActive: false,
        items: []
      },
      {
        title: 'Work Engagements',
        url: '/dashboard/product',
        icon: 'product',
        shortcut: ['w', 'w'],
        isActive: false,
        items: []
      },
      {
        title: 'Agent Intelligence',
        url: '/dashboard/ai-chat',
        icon: 'sparkles',
        shortcut: ['a', 'i'],
        isActive: false,
        items: []
      }
    ]
  },
  {
    label: 'Operations & Verification',
    items: [
      {
        title: 'Client Requests',
        url: '/dashboard/forms',
        icon: 'forms',
        shortcut: ['r', 'r'],
        isActive: false,
        items: [
          {
            title: 'Active Requests',
            url: '/dashboard/forms/basic',
            icon: 'forms',
            shortcut: ['f', 'f']
          },
          {
            title: 'Intake Wizard',
            url: '/dashboard/forms/multi-step',
            icon: 'forms'
          },
          {
            title: 'Quick Dispatch',
            url: '/dashboard/forms/sheet-form',
            icon: 'forms'
          }
        ]
      },
      {
        title: 'Exception Queue',
        url: '/dashboard/elements/icons',
        icon: 'warning',
        isActive: false,
        items: []
      },
      {
        title: 'Evidence Vault',
        url: '/dashboard/exclusive',
        icon: 'exclusive',
        isActive: false,
        items: []
      }
    ]
  },
  {
    label: 'Firm & Governance',
    items: [
      {
        title: 'Workspaces',
        url: '/dashboard/workspaces',
        icon: 'workspace',
        isActive: false,
        items: []
      },
      {
        title: 'Audit Notifications',
        url: '/dashboard/notifications',
        icon: 'notification',
        shortcut: ['n', 'n'],
        isActive: false,
        items: []
      },
      {
        title: 'Billing & Usage',
        url: '/dashboard/billing',
        icon: 'billing',
        shortcut: ['b', 'b'],
        items: []
      }
    ]
  }
];
