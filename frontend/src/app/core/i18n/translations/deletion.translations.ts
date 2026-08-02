import { AppLanguage } from '../app-language';

export interface DeletionTranslations {
  confirmation: {
    title: string;
    descriptionPrefix: string;
    descriptionSuffix: string;
    actions: {
      cancel: string;
      deletePermanently: string;
    };
  };
  errors: {
    forbidden: string;
    notFound: string;
    conflict: string;
    generic: string;
  };
}

export const DELETION_TRANSLATIONS = {
  es: {
    confirmation: {
      title: 'Eliminar de forma permanente',
      descriptionPrefix: 'Vas a eliminar de forma permanente',
      descriptionSuffix: 'Esta acción no se puede deshacer.',
      actions: {
        cancel: 'Cancelar',
        deletePermanently: 'Eliminar de forma permanente',
      },
    },
    errors: {
      forbidden: 'Ya no tienes permiso para eliminar este registro.',
      notFound: 'Este registro ya no existe.',
      conflict: 'Este registro no se puede eliminar porque está siendo utilizado.',
      generic: 'No se ha podido eliminar el registro. Inténtalo de nuevo.',
    },
  },
  en: {
    confirmation: {
      title: 'Delete permanently',
      descriptionPrefix: 'You are about to permanently delete',
      descriptionSuffix: 'This action cannot be undone.',
      actions: {
        cancel: 'Cancel',
        deletePermanently: 'Delete permanently',
      },
    },
    errors: {
      forbidden: 'You no longer have permission to delete this record.',
      notFound: 'This record no longer exists.',
      conflict: 'This record cannot be deleted because it is in use.',
      generic: 'The record could not be deleted. Try again.',
    },
  },
} satisfies Record<AppLanguage, DeletionTranslations>;
