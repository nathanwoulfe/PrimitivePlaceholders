# PrimitivePlaceholders
Generate low-poly SVG preview images for Umbraco media assets

PrimitivePlaceholders is an Umbraco data type for use on media content types with an image cropper or file upload property.

The editor generates a low-polygon (triangle, rectangle and/or ellipse) SVG string from the uploaded asset, for use as a lazy-loading placeholder, or graphic element on the same page as the image.

Since it's SVG, it can be sent down in the initial content request, so it's super quick. Use a CSS transition in the lazy load, and simulate a blur-up from the SVG to your final image.

TODO -> Add a media helper/extension to return template-ready markup including the placeholder and source image, maybe even with the lazy loading bits included. Generous!

## Settings

The data type ships with sensible defaults, but needs a `Soure property alias` value to tell the magic bits where to find the source image, and at least one of 'triangle', 'rectangle', or 'ellipse' in the `Shapes` field.

The others are magical. Fiddle with them and get a different result. Fine tune to suit. Remember though the more complex the output, the longer the SVG string.

## Witchery! Witchery!

The witchcraft driving the polygon generation is not mine, it's a port of [Ondřej Žára's magical javascript port of primitive.lol](https://github.com/ondras/primitive.js).

For a deep dive into how the algorithm works, [Michael Fogleman provides more detail in his original repository](https://github.com/fogleman/primitive).

I've simply taken their awesome work, turned it into a set of AngularJs services, and sprinkled some Umbraco dust on top.
