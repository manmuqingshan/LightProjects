# Color Spaces and Color Temperature

In order to understand how light changes, it's helpful to know a few different ways of describing those changes, and to understand how different qualities of light are created. 

## Color Models

There are a number of different components to color and light. You can talk about component colors, either additive or subtractive; you can talk about hue, saturation, and lightness, or value. Lighting designers tend to talk in terms of *additive primary* colors -- red, green, and blue -- because when you layer light sources together, the effect is addititive. Red, green, and blue sources on the same subject look like white light to the viewer. In contrast, color reflected by a surface pigment is subtractive. If you layer two colors of pigment on top of each other, you'll only see colors that are reflected by both picments. so in that context, we tend to talk in terms of *subtractive primaries*: red, yellow, and blue.

Our mental model of how we light changes generally aren't phrased in terms of primary colors, however. We might talk about how it dims, or how the colors become paler as it gets brighter, or we might talk about how a light gets warmer as it fades out. We might talk about how the sky shifts from a pale blue to brilliant oranges and reds as the sun sets, as in this quote:

<blockquote>"Soon it got dusk, a grapy dusk, a purple dusk over tangerine groves and long melon fields; the sun the color of pressed grapes, slashed with burgundy red, the fields the color of love and Spanish mysteries."

-Jack Kerouac, "On the Road"</blockquote>

These are terms that describe combinations of colors into different hues. Although a given hue may be made of different primary colors, we don't think in terms of the primary colors composing a particular color like tangerine or burgundy. Instead we think of color as one continuous spectrum, with each hue blending into the next. When describing hues, we also speak of the relative saturation of the hue, how intense it is. Higher saturation makes a hue deeper and more vibrant, while lower saturation makes a hue more pale.  In addition to hue and saturation, we can describe the relative value or brightness of the color. Collectively these three describe the *Hue, Saturation, Value (HSV)* or *Hue, Saturation, Brightness (HSB)* color model. Another variation on this describes the hue and saturation and relative lightness or luminosity of the color. This model is called *Hue, Saturation, and Lightness (HSL)*. In this model, the color gradually fades to white as the lightness increases.

To see the differences in control of color afforded by HSV vs. RGB vs. HSL, check out these two interactive models by Rune Madsen, which allow you to change the properties of each model with sliders and to see the result of the change on a sphere or cube:
* [RGB Color Model](https://programmingdesignsystems.com/color/color-models-and-color-spaces/index.html#rgb-cube)
* [HSV color model](https://programmingdesignsystems.com/color/color-models-and-color-spaces/index.html#hsv-cylinder)
* [HSL color model](https://programmingdesignsystems.com/color/color-models-and-color-spaces/index.html#hsl-cylinder)

Although HSV and HSL are useful ways to describe color, they are not native properties to a lighting system that relies on RGB or RGBW control. To control these systems using HSV descriptions, you need a color conversion algorithm. Most LED control libraries now incorporate HSV coneversions.

White light is composed of multiple wavelengths of light, and when describing it, lighting designers and engineers speak about the *color temperature* of the light, referring to its relative warmth or coolness. Warmer light contains more longer wavelengths, toward the red end of the spectrum, while cooler light contains more shorter wavelengths, toward the blue end of the spectrum.

* [Tanner-Helland on color temperature](http://www.tannerhelland.com/4435/convert-temperature-rgb-algorithm-code/)
* [Waveform lighting on CCT](https://www.waveformlighting.com/tech/calculate-color-temperature-cct-from-cie-1931-xy-coordinates)
 * [A beginner's guide to CIE Colorimetry](https://medium.com/hipster-color-science/a-beginners-guide-to-colorimetry-401f1830b65a)
* [Hue Colors gist](https://gist.github.com/popcorn245/30afa0f98eea1c2fd34d)

When you're fading light, then, you need to consider which color model will make for the best fade. Do you want the hue to stay consistent as the light dims? Do you want the light to get cooler or warmer as it changes? Or do you have another fade pattern in mind?

## Computational Color Descriptions
Multi-channel LED control systems like the ones described here describe the relative intensity of each color channel as separate numeric values, or they describe all the colors in one composite number. For example, if you're using RGB LEDs and assigning an 8-bit resolution to each channel, then you'll need three 8-bit numbers to describe what your light source is doing. For example, you might describe red light as 0xFF0000, meaning that the red channel is at 255 (in hexadecimal 0xFF) while the green and blue channels are both at 00. Teal might be described as 0x0088FF (no red, about half green, full blue). 

Now imagine you're writing a program to fade your LEDs. What would the  fade from the following code would look like?

````
 // loop over all the pixels:
  for (int pixel = 0; pixel < pixelCount; pixel++) {
    // set the color for each pixel:
    strip.setPixelColor(pixel, color);   
  }
  // refresh the strip:
  strip.show();
  // decrement the color:
  color--;
  // if it reaches 0, set it back to 0xFFFFFF:
  if (color == 0) color = 0xFFFFFF;
````
 Try it. Here's an [APA102x (DotStar) example]({{site.codeurl}}/APA102x/APA102xRGBFade). It's probably not what you expect. Here's a [NeoPixel (WS281x) version]({{site.codeurl}}/WS281x/WS281xRGBFade).

 You could rearrange things to that you're fading all three colors at the same time:

 ````
 // loop over all the pixels:
  for (int pixel = 0; pixel < pixelCount; pixel++) {
    // set the color for each pixel:
    strip.setPixelColor(pixel, color, color, color);
  }
  // refresh the strip:
  strip.show();
  // decrement the color:
  color--;
  // if it reaches 0, set it back to 0xFFFFFF:
  if (color == 0) color = 0xFF;
  // this fade moves faster, so slow it down so you can see it:
  delay(10);
 ````

This works pretty well for white, but when you try it for an arbitrary set of three colors, it doesn't work too well. If you want to change the  brightness without changing the color, you need a different color model.

### Hue, Saturation, and Brightness

This is where a [Hue, Saturation, Brightness (or Lightness)](https://programmingdesignsystems.com/color/color-models-and-color-spaces/index.html#color-models-and-color-spaces-JDQ1fRD) model becomes useful. In the HSL model, hue is positioned on a color cylinder, with red at the top (0 degrees), green at 120 degrees, and blue at 240 degrees. Saturation is the radius of the cylinder, and lightness is the depth of the cylinder. Here's an [interactive visualization](https://programmingdesignsystems.com/color/color-models-and-color-spaces/index.html#hsl-cylinder) from Rune Madsen's book _Programming Design Systems_. The advantage of this model is that it allows you to change lightness or saturation without changing the hue. It becomes much simpler to create a [flickering candle (DotStar (APA102x) version)]({{site.codeurl}}/Candles/APA102xCandle) that changes from red to yellow through orange, for example. Here's a [NeoPixel (WS281x) version]({{site.codeurl}}/Candles/WS281xCandle).

All the additive colors can be represented in the CIE1931 chromaticity diagram, Figure 1 below. For more on this, see [this page on chromaticity](chromaticity.md). 

![CIE 1931 reference diagram, from Wikimedia](https://upload.wikimedia.org/wikipedia/commons/5/5f/CIE-1931_diagram_in_LAB_space.svg)

_Figure 1. the CIE 1931 Chromaticity reference diagram. Image on Wikipedia._
## References

Many of the references here are indebted to the International [Commission on Illumination](http://www.cie.co.at), CIE. Their [glossary](https://cie.co.at/e-ilv) is a highly valuable resource for lighting enthusiasts and professionals. The rest of their website is a useful resource as well.

There are many different color models, and which one you use depends on the context in which you're talking about color. For a great discussion of [color theory](https://programmingdesignsystems.com/color/a-short-history-of-color-theory/index.html) and [color models and spaces](https://programmingdesignsystems.com/color/color-models-and-color-spaces/index.html), see Rune Madsen's online book _[Programming Design Systems](https://programmingdesignsystems.com)_. 

For a partial glossary ofthe physical properties of light, see the [lighting terminology page](https://itp.nyu.edu/classes/light/lighting-terminology/) from my class on light and interactivity.

For a great set of principles of light to consider in lighting design -— illuminance, luminance, color and temperature, height, density, and direction and distribution —- see _[Architectural Lighting: Designing With Light And Space](https://books.google.com/books/about/Architectural_Lighting.html?id=3QJlJPIX8-sC)_ by Herve Descottes with Ceclia E. Ramos.

For more details on the conversion from RGB and RGBW to HSI, see Saiko LED's [Why Every LED Light Should Be Using HSI](https://blog.saikoled.com/post/43693602826/why-every-led-light-should-be-using-hsi) blog post, along with [How to Convert From HSI to RGB-White](https://blog.saikoled.com/post/44677718712/how-to-convert-from-hsi-to-rgb-white). These are engineering-heavy, but informative. 

[ETC Lighting](http://etcconnect.com/) works hard at increasing the quality of color rendering in their stage lighting fixtures. Here's a nice [description of how they do it in their ColorSource fixtures](https://www.etcconnect.com/Products/Lighting-Fixtures/ColorSource-Spot/Deep-Blue.aspx), and here's a [white paper on color mixing with LEDs](https://www.etcconnect.com/WorkArea/DownloadAsset.aspx?id=10737494297) that forms the basis of their work. 

 [Ketra](https://www.ketra.com/) are architectural lighting manufacturers who work toward similarly high standards in architecture as ETC in the stage lighting area. Here's a nice explanation of Ketra's approach to [warm dimming](https://www.ketra.com/why-ketra/warm-dimming-led-lighting). 
