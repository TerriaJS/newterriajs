import { observer } from "mobx-react";
import PropTypes from "prop-types";
import { Component } from "react";
import { Trans, withTranslation } from "react-i18next";
import defined from "terriajs-cesium/Source/Core/defined";
import Box from "../../Styled/Box";
import Button from "../../Styled/Button";
import Collapsible from "../Custom/Collapsible/Collapsible";
import parseCustomMarkdownToReact from "../Custom/parseCustomMarkdownToReact";
import DataPreviewSections from "./DataPreviewSections";
import ExportData from "./ExportData";
import Styles from "./mappable-preview.scss";
import MetadataTable from "./MetadataTable";
import WarningBox from "./WarningBox";

/**
 * CatalogItem description.
 */
@observer
class Description extends Component {
  static propTypes = {
    item: PropTypes.object.isRequired,
    printView: PropTypes.bool,
    t: PropTypes.func.isRequired
  };

  renderDescription(catalogItem) {
    if (catalogItem.type === "wms") {
      return (
        <p key="wms-description">
          <Trans i18nKey="description.wms">
            This is a
            <a
              href="https://en.wikipedia.org/wiki/Web_Map_Service"
              target="_blank"
              rel="noopener noreferrer"
            >
              WMS service
            </a>
            , which generates map images on request. It can be used in GIS
            software with this URL:
          </Trans>
        </p>
      );
    } else if (catalogItem.type === "wfs") {
      return (
        <p key="wfs-description">
          <Trans i18nKey="description.wfs">
            This is a
            <a
              href="https://en.wikipedia.org/wiki/Web_Feature_Service"
              target="_blank"
              rel="noopener noreferrer"
            >
              WFS service
            </a>
            , which transfers raw spatial data on request. It can be used in GIS
            software with this URL:
          </Trans>
        </p>
      );
    }
    return null;
  }

  render() {
    const { t } = this.props;
    const catalogItem = this.props.item;

    // Make sure all data and metadata URLs have `url` set
    const metadataUrls = catalogItem.metadataUrls?.filter((m) => m.url);
    const dataUrls = catalogItem.dataUrls?.filter((m) => m.url);

    return (
      <div
        className={Styles.description}
        css={`
          a,
          a:visited {
            color: ${(p) => p.theme.colorPrimary};
          }
        `}
      >
        {catalogItem.isExperiencingIssues && (
          <WarningBox>{t("preview.mayBeExperiencingIssues")}</WarningBox>
        )}

        {catalogItem.description && catalogItem.description.length > 0 && (
          <div>
            <h4 className={Styles.h4}>{t("description.name")}</h4>
            {parseCustomMarkdownToReact(catalogItem.description, {
              catalogItem: catalogItem
            })}
          </div>
        )}

        {catalogItem.hasLocalData && <p>{t("description.dataLocal")}</p>}

        {!catalogItem.hasLocalData &&
          !catalogItem.hasDescription &&
          !catalogItem.hideDefaultDescription && (
            <p>{t("description.dataNotLocal")}</p>
          )}

        {metadataUrls && metadataUrls.length > 0 && (
          <>
            <h4 className={Styles.h4}>{t("description.metadataUrls")}</h4>
            {metadataUrls.map((metadataUrl, _i) => (
              <Box paddedVertically key={metadataUrl.url}>
                <a
                  href={metadataUrl.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${Styles.link} description-metadataUrls`}
                  css={`
                    color: ${(p) => p.theme.colorPrimary};
                  `}
                >
                  {metadataUrl.title && (
                    <Button primary>{metadataUrl.title}</Button>
                  )}
                  {!metadataUrl.title ? metadataUrl.url : null}
                </a>
              </Box>
            ))}
          </>
        )}

        <DataPreviewSections metadataItem={catalogItem} />

        {catalogItem.dataCustodian && catalogItem.dataCustodian.length > 0 && (
          <div>
            <h4 className={Styles.h4}>{t("description.dataCustodian")}</h4>
            {parseCustomMarkdownToReact(catalogItem.dataCustodian, {
              catalogItem: catalogItem
            })}
          </div>
        )}

        {!catalogItem.hideSource && (
          <>
            {catalogItem.url && (
              <>
                <h4 className={Styles.h4}>{catalogItem.typeName} URL</h4>

                {this.renderDescription(catalogItem)}

                {this.props.printView ? (
                  <code>{catalogItem.url}</code>
                ) : (
                  <input
                    readOnly
                    className={Styles.field}
                    type="text"
                    value={catalogItem.url}
                    onClick={(e) => e.target.select()}
                  />
                )}

                {catalogItem.type === "wms" ||
                  (catalogItem.type === "esri-mapServer" &&
                    defined(catalogItem.layers) && (
                      <p key="wms-layers">
                        {t("description.layerName")}
                        {(catalogItem.layers || "").split(",").length > 1
                          ? "s"
                          : ""}
                        : {catalogItem.layers}
                      </p>
                    ))}

                {catalogItem.type === "wfs" && (
                  <p key="wfs-typeNames">
                    {t("description.typeName")}
                    {(catalogItem.typeNames || "").split(",").length > 1
                      ? "s"
                      : ""}
                    : {catalogItem.typeNames}
                  </p>
                )}
              </>
            )}

            {dataUrls && dataUrls.length > 0 && (
              <>
                <h4 className={Styles.h4}>{t("description.dataUrl")}</h4>
                {dataUrls.map(
                  (dataUrl, _i) =>
                    (dataUrl.type?.startsWith("wfs") ||
                      dataUrl.type?.startsWith("wcs")) && (
                      <>
                        {dataUrl.type?.startsWith("wfs") &&
                          parseCustomMarkdownToReact(
                            t("description.useLinkBelow", {
                              link: `
                          <a
                            href="http://docs.geoserver.org/latest/en/user/services/wfs/reference.html"
                            target="_blank"
                            rel="noopener noreferrer"
                            key="wfs"
                          >
                            Web Feature Service (WFS) documentation
                          </a>
                        `
                            })
                          )}
                        {dataUrl.type?.startsWith("wcs") &&
                          parseCustomMarkdownToReact(
                            t("description.useLinkBelow", {
                              link: `
                          <a
                            href="http://docs.geoserver.org/latest/en/user/services/wcs/reference.html"
                            target="_blank"
                            rel="noopener noreferrer"
                            key="wms"
                          >
                            Web Coverage Service (WCS) documentation
                          </a>
                        `
                            })
                          )}
                        <Box paddedVertically key={dataUrl.url}>
                          <a
                            href={dataUrl.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`${Styles.link} description-dataUrls`}
                            css={`
                              color: ${(p) => p.theme.colorPrimary};
                            `}
                          >
                            {dataUrl.title && (
                              <Button primary>{dataUrl.title}</Button>
                            )}
                            {!dataUrl.title ? dataUrl.url : null}
                          </a>
                        </Box>{" "}
                      </>
                    )
                )}
              </>
            )}

            {!this.props.printView && defined(catalogItem.metadata) && (
              <>
                {defined(catalogItem.metadata.dataSourceMetadata) &&
                  catalogItem.metadata.dataSourceMetadata.items.length > 0 && (
                    <div className={Styles.metadata}>
                      <Collapsible
                        title={t("description.dataSourceDetails")}
                        isInverse
                      >
                        <MetadataTable
                          metadataItem={catalogItem.metadata.dataSourceMetadata}
                        />
                      </Collapsible>
                    </div>
                  )}
                {defined(catalogItem.metadata.dataSourceMetadata) &&
                  catalogItem.metadata.dataSourceMetadata.items.length > 0 && (
                    <div className={Styles.metadata}>
                      <Collapsible
                        title={t("description.dataServiceDetails")}
                        isInverse
                      >
                        <MetadataTable
                          metadataItem={catalogItem.metadata.serviceMetadata}
                        />
                      </Collapsible>
                    </div>
                  )}
              </>
            )}
          </>
        )}
        {!this.props.printView ? <ExportData item={catalogItem} /> : null}
      </div>
    );
  }
}

export default withTranslation()(Description);
