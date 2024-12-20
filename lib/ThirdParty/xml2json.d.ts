export default function xml2json(
  xml: XMLDocument | string | undefined,
  extended?: boolean
): { [key: string]: any } | string | null | undefined;
