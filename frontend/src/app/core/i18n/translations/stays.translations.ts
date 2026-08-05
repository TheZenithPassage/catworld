import { AppLanguage } from '../app-language';

export interface StaysTranslations {
  emptyValue: string;
  nights: {
    singular: string;
    plural: string;
  };
  status: {
    reserved: string;
    'checked-in': string;
    'checked-out': string;
    cancelled: string;
  };
  pricing: {
    title: string;
    loading: string;
    enterInputs: string;
    nights: string;
    retainedRate: string;
    suggestion: string;
    agreement: string;
    currentAgreement: string;
    reason: string;
    unavailable: string;
    confirm: string;
    confirmed: string;
    stale: string;
    noReconfirmation: string;
    adminRequired: string;
    economics: string;
    totalPaid: string;
    remaining: string;
    correctAgreement: string;
    correct: string;
    cancelCorrection: string;
    errors: {
      invalidAmount: string;
      reasonRequired: string;
      confirmationRequired: string;
      previewRequired: string;
      previewFailed: string;
      stale: string;
      adminRequired: string;
      correctionReasonRequired: string;
      correctionFailed: string;
    };
  };
  filters: {
    searchAriaLabel: string;
    paymentAriaLabel: string;
    outstandingOnly: string;
    paymentCondition: {
      NO_PAYMENT: string;
      PARTIAL_PAYMENT: string;
      FULL_PAYMENT: string;
    };
    cat: string;
    searchCat: string;
    clear: string;
    noCatsMatch: string;
    owner: string;
    searchOwnerOrCats: string;
    noOwnersMatch: string;
  };
  vaccineConflict: {
    title: string;
    description: string;
    vaccine: {
      rabies: string;
      tripleFeline: string;
    };
    reason: {
      missing: string;
      expired: string;
    };
    actions: {
      dismiss: string;
      cancel: string;
      continue: string;
    };
  };
  overview: {
    title: string;
    description: string;
    create: string;
    statusFiltersAriaLabel: string;
    loading: string;
    retry: string;
    empty: string;
    emptyFiltered: string;
    errorLoading: string;
    errorCancelling: string;
    table: {
      state: string;
      start: string;
      end: string;
      nights: string;
      cats: string;
      owner: string;
      notes: string;
      actions: string;
    };
    edit: string;
    cancel: string;
    cancelling: string;
    alreadyCancelled: string;
    alreadyCheckedOut: string;
    cancelConfirmPrefix: string;
    cancelConfirmSuffix: string;
    catSingular: string;
    catPlural: string;
  };
  create: {
    title: string;
    description: string;
    loading: string;
    owner: string;
    selectOwner: string;
    createOwner: string;
    cats: string;
    noCatsForOwner: string;
    createCat: string;
    startDateTime: string;
    endDateTime: string;
    notes: string;
    submit: string;
    submitting: string;
    errors: {
      loadFormDataFailed: string;
      selectAtLeastOneCat: string;
      datesRequired: string;
      endAfterStart: string;
      createFailed: string;
    };
  };
  edit: {
    title: string;
    description: string;
    backToStays: string;
    loading: string;
    owner: string;
    cats: string;
    startDateTime: string;
    endDateTime: string;
    notes: string;
    submit: string;
    submitting: string;
    errors: {
      stayIdMissing: string;
      closedCannotBeModified: string;
      loadFailed: string;
      dataNotLoaded: string;
      datesRequired: string;
      endAfterStart: string;
      updateFailed: string;
    };
  };
}

export const STAYS_TRANSLATIONS = {
  es: {
    emptyValue: '-',
    nights: {
      singular: 'noche',
      plural: 'noches',
    },
    status: {
      reserved: 'Reservada',
      'checked-in': 'En curso',
      'checked-out': 'Finalizada',
      cancelled: 'Cancelada',
    },
    pricing: {
      title: 'Precio acordado',
      loading: 'Calculando la propuesta autoritativa...',
      enterInputs: 'Selecciona fechas y gatos válidos para obtener la propuesta.',
      nights: 'Noches',
      retainedRate: 'Tarifa retenida',
      suggestion: 'Importe sugerido',
      agreement: 'Importe acordado',
      currentAgreement: 'Importe acordado actual',
      reason: 'Motivo económico',
      unavailable: 'No disponible',
      confirm: 'Confirmar precio',
      confirmed: 'Precio confirmado',
      stale: 'La base del precio cambió. Revisa la nueva propuesta y vuelve a confirmarla.',
      noReconfirmation: 'Este cambio no requiere volver a confirmar el precio.',
      adminRequired: 'Solo un administrador puede completar un cambio que modifica el precio.',
      economics: 'Economía',
      totalPaid: 'Total pagado',
      remaining: 'Pendiente',
      correctAgreement: 'Corregir importe',
      correct: 'Guardar corrección',
      cancelCorrection: 'Cancelar',
      errors: {
        invalidAmount: 'Introduce un importe entero no negativo de hasta 19 dígitos.',
        reasonRequired: 'Indica un motivo cuando el importe difiere de la propuesta.',
        confirmationRequired: 'Revisa y confirma el precio actual antes de continuar.',
        previewRequired: 'Es necesaria una propuesta de precio actual.',
        previewFailed: 'No se pudo obtener la propuesta de precio.',
        stale: 'La confirmación del precio está desactualizada. Confirma la nueva propuesta.',
        adminRequired: 'Solo un administrador puede confirmar este nuevo precio.',
        correctionReasonRequired: 'Indica el motivo de la corrección.',
        correctionFailed: 'No se pudo corregir el importe acordado.',
      },
    },
    filters: {
      searchAriaLabel: 'Filtros de búsqueda de estancias',
      paymentAriaLabel: 'Filtros de cobro de estancias',
      outstandingOnly: 'Solo cobros pendientes',
      paymentCondition: {
        NO_PAYMENT: 'Sin pagos',
        PARTIAL_PAYMENT: 'Pago parcial',
        FULL_PAYMENT: 'Pago completo',
      },
      cat: 'Gato',
      searchCat: 'Buscar gato',
      clear: 'Limpiar',
      noCatsMatch: 'Ningún gato coincide con esta búsqueda.',
      owner: 'Dueño',
      searchOwnerOrCats: 'Buscar dueño o uno de sus gatos',
      noOwnersMatch: 'Ningún dueño coincide con esta búsqueda.',
    },
    vaccineConflict: {
      title: 'Conflictos de vacunación',
      description:
        'Las vacunas guardadas no cubren toda la estancia. Revisa cada conflicto antes de continuar.',
      vaccine: {
        rabies: 'Rabia',
        tripleFeline: 'Triple felina',
      },
      reason: {
        missing: 'Falta la fecha de vacunación',
        expired: 'La vacuna caduca el día que termina la estancia o antes',
      },
      actions: {
        dismiss: 'Cerrar',
        cancel: 'Cancelar',
        continue: 'Continuar de todos modos',
      },
    },
    overview: {
      title: 'Estancias',
      description: 'Desde aquí puedes administrar las estancias activas y crear nuevas.',
      create: 'Crear estancia',
      statusFiltersAriaLabel: 'Filtros de estado de estancias',
      loading: 'Cargando estancias...',
      retry: 'Reintentar',
      empty: 'No hay estancias registradas.',
      emptyFiltered: 'Ninguna estancia coincide con los filtros seleccionados.',
      errorLoading: 'Error al cargar estancias',
      errorCancelling: 'Error al cancelar la estancia',
      table: {
        state: 'Estado',
        start: 'Inicio',
        end: 'Fin',
        nights: 'Noches',
        cats: 'Gatos',
        owner: 'Dueño',
        notes: 'Notas',
        actions: 'Acciones',
      },
      edit: 'Editar',
      cancel: 'Cancelar',
      cancelling: 'Cancelando...',
      alreadyCancelled: 'Cancelada',
      alreadyCheckedOut: 'Finalizada',
      cancelConfirmPrefix: '¿Cancelar estancia para ',
      cancelConfirmSuffix: '?',
      catSingular: 'gato',
      catPlural: 'gatos',
    },
    create: {
      title: 'Crear estancia',
      description: 'Registrar una nueva estancia.',
      loading: 'Cargando datos del formulario...',
      owner: 'Dueño',
      selectOwner: 'Selecciona un dueño',
      createOwner: 'Crear dueño',
      cats: 'Gatos',
      noCatsForOwner: 'No se encontraron gatos para este dueño.',
      createCat: 'Crear gato',
      startDateTime: 'Fecha/hora de inicio',
      endDateTime: 'Fecha/hora de fin',
      notes: 'Notas',
      submit: 'Crear estancia',
      submitting: 'Creando...',
      errors: {
        loadFormDataFailed: 'Error al cargar los datos del formulario',
        selectAtLeastOneCat: 'Selecciona al menos un gato',
        datesRequired: 'La fecha de inicio y fin son obligatorias',
        endAfterStart: 'La fecha de fin debe ser posterior a la fecha de inicio',
        createFailed: 'Error al crear la estancia',
      },
    },
    edit: {
      title: 'Editar estancia',
      description: 'Actualizar fechas y notas de la estancia.',
      backToStays: 'Volver',
      loading: 'Cargando estancia...',
      owner: 'Dueño',
      cats: 'Gatos',
      startDateTime: 'Fecha/hora de inicio',
      endDateTime: 'Fecha/hora de fin',
      notes: 'Notas',
      submit: 'Guardar cambios',
      submitting: 'Guardando...',
      errors: {
        stayIdMissing: 'Falta el id de la estancia',
        closedCannotBeModified: 'Las estancias cerradas no se pueden modificar',
        loadFailed: 'Error al cargar la estancia',
        dataNotLoaded: 'Los datos de la estancia no están cargados',
        datesRequired: 'La fecha de inicio y fin son obligatorias',
        endAfterStart: 'La fecha de fin debe ser posterior a la fecha de inicio',
        updateFailed: 'Error al actualizar la estancia',
      },
    },
  },
  en: {
    emptyValue: '-',
    nights: {
      singular: 'night',
      plural: 'nights',
    },
    status: {
      reserved: 'Reserved',
      'checked-in': 'Checked-in',
      'checked-out': 'Checked-out',
      cancelled: 'Cancelled',
    },
    pricing: {
      title: 'Agreed pricing',
      loading: 'Loading authoritative pricing...',
      enterInputs: 'Select valid dates and cats to obtain pricing.',
      nights: 'Nights',
      retainedRate: 'Retained rate',
      suggestion: 'Suggested amount',
      agreement: 'Agreed amount',
      currentAgreement: 'Current agreed amount',
      reason: 'Economic reason',
      unavailable: 'Unavailable',
      confirm: 'Confirm pricing',
      confirmed: 'Pricing confirmed',
      stale: 'The pricing basis changed. Review the fresh preview and confirm it again.',
      noReconfirmation: 'This change does not require pricing reconfirmation.',
      adminRequired: 'Only an administrator can complete a pricing-affecting change.',
      economics: 'Economics',
      totalPaid: 'Total paid',
      remaining: 'Remaining',
      correctAgreement: 'Correct agreement',
      correct: 'Save correction',
      cancelCorrection: 'Cancel',
      errors: {
        invalidAmount: 'Enter a non-negative whole amount with at most 19 digits.',
        reasonRequired: 'Provide a reason when the agreement differs from the suggestion.',
        confirmationRequired: 'Review and confirm the current pricing before continuing.',
        previewRequired: 'A current pricing preview is required.',
        previewFailed: 'Pricing preview could not be loaded.',
        stale: 'The pricing confirmation is stale. Confirm the fresh preview.',
        adminRequired: 'Only an administrator can confirm this new pricing.',
        correctionReasonRequired: 'Provide a reason for the correction.',
        correctionFailed: 'The agreed amount could not be corrected.',
      },
    },
    filters: {
      searchAriaLabel: 'Stay search filters',
      paymentAriaLabel: 'Stay payment filters',
      outstandingOnly: 'Outstanding collection only',
      paymentCondition: {
        NO_PAYMENT: 'No payment',
        PARTIAL_PAYMENT: 'Partial payment',
        FULL_PAYMENT: 'Full payment',
      },
      cat: 'Cat',
      searchCat: 'Search cat',
      clear: 'Clear',
      noCatsMatch: 'No cats match this search.',
      owner: 'Owner',
      searchOwnerOrCats: 'Search owner or one of their cats',
      noOwnersMatch: 'No owners match this search.',
    },
    vaccineConflict: {
      title: 'Vaccine conflicts',
      description:
        'The stored vaccinations do not cover the complete stay. Review every conflict before continuing.',
      vaccine: {
        rabies: 'Rabies',
        tripleFeline: 'Triple feline',
      },
      reason: {
        missing: 'Vaccination date is missing',
        expired: 'Vaccination expires on or before the stay ends',
      },
      actions: {
        dismiss: 'Dismiss',
        cancel: 'Cancel',
        continue: 'Continue anyway',
      },
    },
    overview: {
      title: 'Stays',
      description: 'Here you can manage active stays and create new ones.',
      create: 'Create stay',
      statusFiltersAriaLabel: 'Stay status filters',
      loading: 'Loading stays...',
      retry: 'Retry',
      empty: 'No stays registered.',
      emptyFiltered: 'No stays match the selected filters.',
      errorLoading: 'Error loading stays',
      errorCancelling: 'Error cancelling stay',
      table: {
        state: 'State',
        start: 'Start',
        end: 'End',
        nights: 'Nights',
        cats: 'Cats',
        owner: 'Owner',
        notes: 'Notes',
        actions: 'Actions',
      },
      edit: 'Edit',
      cancel: 'Cancel',
      cancelling: 'Cancelling...',
      alreadyCancelled: 'Already cancelled',
      alreadyCheckedOut: 'Already checked-out',
      cancelConfirmPrefix: 'Cancel stay for ',
      cancelConfirmSuffix: '?',
      catSingular: 'cat',
      catPlural: 'cats',
    },
    create: {
      title: 'Create stay',
      description: 'Register a new stay.',
      loading: 'Loading form data...',
      owner: 'Owner',
      selectOwner: 'Select an owner',
      createOwner: 'Create owner',
      cats: 'Cats',
      noCatsForOwner: 'No cats found for this owner.',
      createCat: 'Create cat',
      startDateTime: 'Start date/time',
      endDateTime: 'End date/time',
      notes: 'Notes',
      submit: 'Create stay',
      submitting: 'Creating...',
      errors: {
        loadFormDataFailed: 'Error loading form data',
        selectAtLeastOneCat: 'Select at least one cat',
        datesRequired: 'Start and end date are required',
        endAfterStart: 'End date must be after start date',
        createFailed: 'Error creating stay',
      },
    },
    edit: {
      title: 'Edit stay',
      description: 'Update stay dates and notes.',
      backToStays: 'Back to stays',
      loading: 'Loading stay...',
      owner: 'Owner',
      cats: 'Cats',
      startDateTime: 'Start date/time',
      endDateTime: 'End date/time',
      notes: 'Notes',
      submit: 'Save changes',
      submitting: 'Saving...',
      errors: {
        stayIdMissing: 'Stay id is missing',
        closedCannotBeModified: 'Closed stays cannot be modified',
        loadFailed: 'Error loading stay',
        dataNotLoaded: 'Stay data is not loaded',
        datesRequired: 'Start and end date are required',
        endAfterStart: 'End date must be after start date',
        updateFailed: 'Error updating stay',
      },
    },
  },
} satisfies Record<AppLanguage, StaysTranslations>;
