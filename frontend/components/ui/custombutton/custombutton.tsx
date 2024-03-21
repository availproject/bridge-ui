import { FC } from "react";
import buttonStyle from "./custombutton.module.css";

interface ButtonProps {
  text?: string;
  className: string;
}

export const CustomButton: FC<ButtonProps> = ({ text, className }) => (
  <button className={buttonStyle[className]}>{text}</button>
);
