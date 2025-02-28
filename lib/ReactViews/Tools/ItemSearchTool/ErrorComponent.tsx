import { FC } from "react";

import Text from "../../../Styled/Text";

const ErrorComponent: FC = ({ children }) => {
  return (
    <Text large textLight>
      {children}
    </Text>
  );
};

export default ErrorComponent;
