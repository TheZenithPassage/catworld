import { AppLanguage } from '../app-language';

export interface DashboardTranslations {
  title: string;
  description: string;
  links: {
    stays: {
      title: string;
      description: string;
    };
    calendar: {
      title: string;
      description: string;
    };
    cats: {
      title: string;
      description: string;
    };
    owners: {
      title: string;
      description: string;
    };
    vets: {
      title: string;
      description: string;
    };
  };
  quickActions: {
    title: string;
    createStay: string;
    createOwner: string;
    createCat: string;
    createVet: string;
  };
}

export const DASHBOARD_TRANSLATIONS = {
  es: {
    title: 'Panel de administración',
    description:
      'Desde aquí puedes gestionar las estancias, dueños o gatos y acceder al calendario.',
    links: {
      stays: {
        title: 'Estancias',
        description: 'Ver, crear, editar y cancelar estancias.',
      },
      calendar: {
        title: 'Calendario',
        description: 'Revisar estancias en una vista de calendario.',
      },
      cats: {
        title: 'Gatos',
        description: 'Ver gatos registrados y agregar gatos a dueños existentes.',
      },
      owners: {
        title: 'Dueños',
        description: 'Ver información de contacto de dueños y registrar nuevos dueños.',
      },
      vets: {
        title: 'Veterinarios',
        description: 'Ver veterinarios registrados o agregar uno nuevo.',
      },
    },
    quickActions: {
      title: 'Acciones rápidas',
      createStay: 'Crear estancia',
      createOwner: 'Crear dueño',
      createCat: 'Crear gato',
      createVet: 'Crear veterinario',
    },
  },
  en: {
    title: 'Dashboard',
    description: 'Here you can manage stays, owners or cats and access the calendar.',
    links: {
      stays: {
        title: 'Stays',
        description: 'View reservations, create new stays and manage active ones.',
      },
      calendar: {
        title: 'Calendar',
        description: 'Review stays in a calendar view.',
      },
      cats: {
        title: 'Cats',
        description: 'Browse registered cats and add cats to existing owners.',
      },
      owners: {
        title: 'Owners',
        description: 'Browse owner contact information and register new owners.',
      },
      vets: {
        title: 'Vets',
        description: 'Browse registered vets or add a new one.',
      },
    },
    quickActions: {
      title: 'Quick actions',
      createStay: 'Create stay',
      createOwner: 'Create owner',
      createCat: 'Create cat',
      createVet: 'Create vet',
    },
  },
} satisfies Record<AppLanguage, DashboardTranslations>;
