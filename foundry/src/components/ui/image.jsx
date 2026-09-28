import * as React from "react"
import { ResponsiveImage } from "./responsive-image"
import {
  getOriginalImageUrl,
  IMAGE_LOAD_MODE,
  nextImageLoadMode,
  parseWixMediaUrl,
} from "./image-helpers"

const FALLBACK_IMAGE_URL =
  "https://static.wixstatic.com/media/12d367_4f26ccd17f8f4e3a8958306ea08c2332~mv2.png"

/**
 * Image with built-in Wix Media Platform support: canonical public images on
 * media.base44.com and static.wixstatic.com/media are resized to the rendered
 * container per device pixel ratio and re-encoded to WebP; `fittingType="fill"`
 * crops server-side, optionally anchored at a focal point. Other URLs render
 * as a plain <img>. Failed transforms retry the original URL; only a broken
 * original swaps to the generic fallback image.
 */
const Image = React.forwardRef(
  (
    {
      src: source,
      fittingType = "fill",
      originWidth,
      originHeight,
      focalPointX,
      focalPointY,
      quality = 90,
      onError,
      ...props
    },
    ref
  ) => {
    const [previewSource, setPreviewSource] = React.useState(null)
    const preview = previewSource?.source === source ? previewSource : null
    const src = preview ? preview.value : source
    const replaceSource = (value, className) => setPreviewSource({
      source, value, className, sourceClassName: props.className,
    })
    React.useEffect(() => setPreviewSource(null), [source])
    const parsedSource = src && src !== FALLBACK_IMAGE_URL ? parseWixMediaUrl(src) : null
    const initialMode = parsedSource ? IMAGE_LOAD_MODE.OPTIMIZED : IMAGE_LOAD_MODE.ORIGINAL
    const [loadState, setLoadState] = React.useState({ src, mode: initialMode })
    const mode = loadState.src === src ? loadState.mode : initialMode

    React.useEffect(() => {
      setLoadState({ src, mode: initialMode })
    }, [src, initialMode])

    const handleError = (event) => {
      if (mode === IMAGE_LOAD_MODE.FALLBACK) return
      const nextMode = nextImageLoadMode(mode)
      setLoadState({ src, mode: nextMode })
      if (nextMode === IMAGE_LOAD_MODE.FALLBACK) onError?.(event)
    }

    const imageProps = {
      ...props,
      className: preview && preview.sourceClassName === props.className ? preview.className : props.className,
      onError: handleError,
    }

    if (!src) {
      // Renders as a real <img> (not a <div>) — the visual editor's
      // click-to-edit toolbar keys its "Replace Image" action off the DOM
      // tag being `img`, so a placeholder div would be unrecoverable in the
      // editor. FALLBACK_IMAGE_URL doubles as the "no image chosen" graphic.
      return <img ref={ref} src={FALLBACK_IMAGE_URL} {...imageProps} data-empty-image />
    }

    // A failed transform retries the underlying original as a plain image.
    // Only a failure of that original advances to the generic fallback.
    const parsed = mode === IMAGE_LOAD_MODE.OPTIMIZED ? parsedSource : null

    if (!parsed) {
      const isErrorMode = mode === IMAGE_LOAD_MODE.FALLBACK
      const imageSrc = isErrorMode ? FALLBACK_IMAGE_URL : getOriginalImageUrl(src, parsedSource)
      return (
        <img ref={ref} src={imageSrc} {...imageProps} data-error-image={isErrorMode || undefined} />
      )
    }

    const focalPoint =
      typeof focalPointX === "number" && typeof focalPointY === "number"
        ? { x: focalPointX, y: focalPointY }
        : undefined
    // Origin dimensions are optional — when known they stabilize layout via
    // the wrapper's aspect-ratio before the image loads.
    const aspectRatio =
      originWidth && originHeight ? `${originWidth} / ${originHeight}` : undefined

    return (
      <ResponsiveImage
        ref={ref}
        src={src}
        parsed={parsed}
        onSourceChange={replaceSource}
        fittingType={fittingType}
        focalPoint={focalPoint}
        quality={quality}
        aspectRatio={aspectRatio}
        {...imageProps}
      />
    )
  }
)
Image.displayName = "Image"

export { Image }
