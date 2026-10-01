// Stand-in for react-router-dom in a static portfolio: links don't navigate.
import { forwardRef } from "react";

export const Link = forwardRef(function Link({ to, onClick, ...props }, ref) {
  return (
    <a ref={ref} href={typeof to === "string" ? to : "#"} {...props}
      onClick={(e) => { e.preventDefault(); onClick?.(e); }} />
  );
});
export const useHistory = () => ({ push() {} });
export const useLocation = () => ({ pathname: "/", search: "", hash: "" });
