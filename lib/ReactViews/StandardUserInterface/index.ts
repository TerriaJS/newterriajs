let StandardUserInterface;
(async () => {
  StandardUserInterface =
    typeof window === "undefined"
      ? null
      : await import("./StandardUserInterface");
})();

export default StandardUserInterface;
export { terriaTheme } from "./StandardTheme";
