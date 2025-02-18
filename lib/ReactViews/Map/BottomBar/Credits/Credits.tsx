import { FC } from "react";
import { Credit } from "./Credit";
import { ICredit } from "./Credit.type";

interface ICreditsProps {
  credits?: ICredit[];
}

export const Credits: FC<React.PropsWithChildren<ICreditsProps>> = ({
  credits
}) => {
  if (!credits || credits.length === 0) {
    return null;
  }
  return (
    <>
      {credits.map((credit, index) => (
        <Credit
          key={index}
          credit={credit}
          lastElement={index === credits.length - 1}
        />
      ))}
    </>
  );
};
