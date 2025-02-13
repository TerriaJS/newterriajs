import { FC } from "react";
import Box from "../../../../Styled/Box";
import logo from "../../../../../wwwroot/images/terria-watermark.svg";

export const TerriaLogo: FC = () => {
  return (
    <Box
      as={"a"}
      target="_blank"
      rel="noopener noreferrer"
      href="https://terria.io/"
    >
      <img css={{ height: "24px" }} src={logo} title="Built with Terria" />
    </Box>
  );
};
