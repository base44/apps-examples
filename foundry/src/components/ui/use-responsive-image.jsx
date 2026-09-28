import * as React from "react"
import { useSize } from "../../hooks/use-size"
import { cn } from "../../lib/utils"
import { DEFAULT_TRANSFORM_WIDTH, getImagePreviewClassName } from "./image-helpers"

export function useResponsiveImage({ parsed, fittingType, focalPoint, quality, className, onLoad, onSourceChange }, parentRef) {
  const wrapperRef = React.useRef(null)
  const imgRef = React.useRef(null)
  const size = useSize(wrapperRef)
  const [loaded, setLoaded] = React.useState(false)

  React.useImperativeHandle(parentRef, () => imgRef.current)
  React.useEffect(() => setLoaded(false), [parsed.baseUrl])
  React.useEffect(() => {
    const wrapper = wrapperRef.current
    const replace = (event) => onSourceChange(
      event.detail.src, getImagePreviewClassName(className, wrapper.className, cn("inline-block relative", className))
    )
    wrapper.addEventListener("base44:image-replace", replace)
    return () => wrapper.removeEventListener("base44:image-replace", replace)
  }, [className, onSourceChange])

  const crop = fittingType !== "fit"
  // Wait for useSize's pre-paint measurement before requesting a transform.
  const options = size && {
    width: size.width || DEFAULT_TRANSFORM_WIDTH,
    height: size.height || undefined,
    crop,
    focalPoint: crop ? focalPoint : undefined,
    quality,
  }

  return {
    wrapperRef, imgRef, loaded, options,
    handleLoad: (event) => {
      setLoaded(true)
      onLoad?.(event)
    },
  }
}
