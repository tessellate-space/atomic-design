// Kept out of the stories glob on purpose: one story renders, one throws.
export default { title: "Harness/Broken", render: () => <p>fixture renders</p> };
export const Renders = {};
export const Throws = { render: () => { throw new Error("boom"); } };
