import type { InfobarContent } from '@/components/ui/infobar';

export const workspacesInfoContent: InfobarContent = {
  title: 'Workspaces',
  sections: [
    {
      title: 'Overview',
      description:
        'A workspace is one Avenra organization: its clients, work, evidence, members and billing. You can belong to several workspaces and switch between them at any time.',
      links: []
    },
    {
      title: 'Creating Workspaces',
      description:
        'Enter a name under "Create a workspace". You become its owner and can invite your team from Team Management.',
      links: []
    },
    {
      title: 'Switching Workspaces',
      description:
        'Pick a workspace in the list or in the sidebar switcher. Every page then shows that workspace only.',
      links: []
    },
    {
      title: 'Isolation',
      description:
        'Workspaces are isolated on the server. Every request is checked against your membership, so data from one workspace is never visible in another.',
      links: []
    }
  ]
};

export const teamInfoContent: InfobarContent = {
  title: 'Team Management',
  sections: [
    {
      title: 'Overview',
      description:
        'See who belongs to this workspace and their role, and invite teammates by email.',
      links: []
    },
    {
      title: 'Roles and Permissions',
      description:
        'Owner, Admin, Manager, Member and Viewer each grant a fixed set of permissions (for example work.create, work.approve, information.collect). The server enforces them on every request; the interface only hides what your role cannot use.',
      links: []
    },
    {
      title: 'Invitations',
      description:
        'An invitation is emailed with a single-use link. The invitee signs in or creates an account with that email address and joins with the role you chose.',
      links: []
    }
  ]
};

export const billingInfoContent: InfobarContent = {
  title: 'Billing & Plans',
  sections: [
    {
      title: 'Overview',
      description:
        "Your workspace's plan sets its limits: members, open work, stored files, integrations and assistant usage. Usage is shown against each limit.",
      links: []
    },
    {
      title: 'Changing Plans',
      description:
        'Choosing a self-serve plan opens a secure checkout with the payment provider. Enterprise is arranged with sales.',
      links: []
    },
    {
      title: 'Payment Problems',
      description:
        'If a payment is overdue the workspace stays readable, but adding members, work, integrations, files or assistant calls is paused until billing is in good standing.',
      links: []
    },
    {
      title: 'Who Can Manage Billing',
      description:
        'Viewing billing needs billing.read; changing or cancelling a plan needs billing.manage.',
      links: []
    }
  ]
};

export const productInfoContent: InfobarContent = {
  title: 'Work Engagements',
  sections: [
    {
      title: 'Overview',
      description:
        'All work in this workspace with its status, priority, requirement completeness and open exceptions. The list refreshes automatically.',
      links: []
    },
    {
      title: 'Creating Work',
      description:
        'Click "New Work" for a single item, or use the Intake Wizard to create work, list what to collect and send the client request in one go.',
      links: []
    },
    {
      title: 'Completeness & Exceptions',
      description:
        'Completeness counts accepted requirements against required ones. When something needs a person (inconsistent information, an overdue deadline, a failed delivery) an exception appears in the Exception Queue.',
      links: []
    },
    {
      title: 'Status Changes',
      description:
        'Status moves through a server-side state machine. Open a work item to see the moves allowed from its current status; work is cancelled, never deleted.',
      links: []
    }
  ]
};
