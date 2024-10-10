let e;
typeof window > "u" ? e = (...t) => import("./index-ddc0073e.js").then(
  ({ default: n }) => n(...t)
) : e = window.fetch.bind(window);
const i = e;
export {
  i as default
};
