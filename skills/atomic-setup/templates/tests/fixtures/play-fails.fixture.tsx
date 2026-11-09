// A story whose play function fails.
export default { title: "Harness/PlayFails", render: () => <button type="button">go</button> };
export const Plays = { play: async () => { throw new Error("play function failed on purpose"); } };
