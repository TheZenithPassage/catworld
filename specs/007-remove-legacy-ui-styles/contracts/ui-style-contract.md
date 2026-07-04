# UI Style and Retention Contract

This feature does not change backend API contracts, authorization contracts,
persistence contracts, or route contracts. It defines the frontend presentation
contract that implementation and validation must preserve while removing the
legacy native-control styling system.

## Material Foundation

- Authenticated administration surfaces use Angular Material as the default UI
  foundation when Material provides the relevant interactive component.
- Material theme setup remains centralized in `frontend/src/styles.scss`.
- Material customization uses supported Angular Material Sass APIs, public
  component APIs, or scoped local styles. It must not depend on private Material
  DOM structure.

## Custom Styling Boundaries

Custom CSS/SCSS may remain for:

- document and application-level defaults;
- local page and component layout;
- responsive composition;
- CatWorld-specific presentation;
- small shared utilities that are not control systems;
- FullCalendar and other third-party integration boundaries;
- intentionally retained native controls with documented reasons.

Custom CSS/SCSS must not recreate a global component system for native buttons,
inputs, selects, textareas, tables, or control-like links that Material already
replaced.

## Retained Native Control Documentation

Any retained native control or control-like link covered by epic #176 must be
documented with:

- where it remains;
- why Material replacement is not currently appropriate or in scope;
- whether styling is provided by document defaults, local component styles, or a
  third-party integration boundary.

## Preservation Contract

The cleanup must preserve:

- existing routes and navigation outcomes;
- role-sensitive action visibility;
- localized visible copy;
- validation and backend error presentation;
- loading, empty, disabled, success, conflict, and destructive-confirmation
  states;
- keyboard activation and focus visibility;
- target-iPhone and small-laptop usability.
