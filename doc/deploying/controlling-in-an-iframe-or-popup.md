TerriaJS can be configured to accept messages posted to it by its parent window. This is useful when embedding a TerriaJS app in an iframe and when the parent wants to send more data to the embedded app than can be reasonably included in a URL.

First, the TerriaJS app must include a line like this:

```js
updateApplicationOnMessageFromParentWindow(terria, window);
```

Then, the parent window can send messages like this:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>NationalMap Embed Test</title>
  </head>

  <body>
    <iframe
      id="embeddedNationalMap"
      src="https://nationalmap.gov.au"
      width="1024"
      height="768"
    ></iframe>

    <script type="text/javascript">
      window.addEventListener("message", function (e) {
        var iframeWindow = document.getElementById(
          "embeddedNationalMap"
        ).contentWindow;
        if (e.source === iframeWindow && e.data === "ready") {
          // NationalMap is ready to receive messages!
          iframeWindow.postMessage(
            {
              initSources: [
                {
                  initialCamera: {
                    north: -33.827,
                    east: 151.249,
                    south: -33.907,
                    west: 151.165
                  },
                  workbench: ["my-data"],
                  catalog: [
                    {
                      type: "group",
                      name: "Foo",
                      members: [
                        {
                          type: "csv",
                          name: "My Data",
                          id: "my-data",
                          csvString: "POA,Some Value\n2000,1\n2205,2"
                        }
                      ]
                    }
                  ]
                }
              ]
            },
            "https://nationalmap.gov.au"
          );
        }
      });
    </script>
  </body>
</html>
```

Notice that parent is creating a CSV catalog item with embedded data. The CSV is only two lines in this case, but in a real application it could be large, much larger than could fit in a URL.
