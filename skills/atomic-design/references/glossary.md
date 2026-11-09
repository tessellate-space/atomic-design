# Glossary

One definition per term, used by both design and development.

- **Atom**: the smallest useful interface part, such as a button, input, badge or
  icon. Comes from the platform or the team's UI kit.
- **Molecule**: a few atoms combined for one job, such as a search field.
- **Organism**: a distinct section of interface made of molecules and atoms, such
  as a header or an order table.
- **Template**: a layout shared by two or more pages, with its regions as slots.
- **Page**: a route that fills a template with real content and data.
- **Container**: the glue file next to a feature that fetches or subscribes, then
  renders one library component with plain props.
- **Pattern**: a recurring solution in the product, named before it is drawn or
  built; specific to each product.
- **Token**: a named design value (colour, space, type size) that components use
  instead of a literal.
- **Story**: one rendered example of a component in one state, shown in the
  workbench and run as a test.
- **State**: a condition a component can be in, such as empty, loading, error or
  disabled; each meaningful state has a story.
- **Variant**: a deliberate visual or behavioural option of one component, set
  through a prop.
- **Doc card**: the short record of a component: purpose, props contract, states,
  status and owner.
- **Inventory**: the list of the interface parts a product actually has, grouped by
  level and pattern, built before a migration.
- **Baseline**: the recorded list of known rule violations in an existing product;
  it may only shrink.

Distilled from a 2024 cross-disciplinary atomic design study group and production use.
