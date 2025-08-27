import {type EditableReleaseDocument} from '@sanity/client'
import {Stack} from '@sanity/ui'
// eslint-disable-next-line camelcase
import {getTheme_v2} from '@sanity/ui/theme'
import {type ChangeEvent, useCallback, useEffect, useRef, useState} from 'react'
import {css, styled} from 'styled-components'

import {useTranslation} from '../../../i18n/hooks/useTranslation'

const MAX_DESCRIPTION_HEIGHT = 200

const TitleTextArea = styled.textarea((props) => {
  const {color, font} = getTheme_v2(props.theme)
  return css`
    resize: none;
    overflow: hidden;
    appearance: none;
    background: none;
    border: 0;
    padding: 0;
    border-radius: 0;
    outline: none;
    width: 100%;
    box-sizing: border-box;
    font-family: ${font.text.family};
    font-weight: ${font.text.weights.bold};
    font-size: ${font.text.sizes[4].fontSize}px;
    line-height: ${font.text.sizes[4].lineHeight}px;
    min-height: ${font.text.sizes[4].lineHeight}px;
    margin: 0;
    position: relative;
    z-index: 1;
    display: block;
    /* NOTE: This is a hack to disable Chrome's autofill styles */
    &:-webkit-autofill,
    &:-webkit-autofill:hover,
    &:-webkit-autofill:focus,
    &:-webkit-autofill:active {
      -webkit-text-fill-color: var(--input-fg-color) !important;
      transition: background-color 5000s;
      transition-delay: 86400s /* 24h */;
    }

    color: ${color.input.default.enabled.fg};

    &::placeholder {
      color: ${color.input.default.enabled.placeholder};
    }
  `
})

const DescriptionTextArea = styled.textarea((props) => {
  const {color, font} = getTheme_v2(props.theme)

  return css`
    resize: none;
    overflow: hidden;
    appearance: none;
    background: none;
    border: 0;
    padding: 0;
    border-radius: 0;
    outline: none;
    width: 100%;
    box-sizing: border-box;
    font-family: ${font.text.family};
    font-weight: ${font.text.weights.regular};
    font-size: ${font.text.sizes[2].fontSize}px;
    height: auto;
    line-height: ${font.text.sizes[2].lineHeight}px;
    margin: 0;
    max-width: 624px;
    position: relative;
    z-index: 1;
    display: block;
    color: ${color.input.default.enabled.fg};

    &::placeholder {
      color: ${color.input.default.enabled.placeholder};
    }
  `
})

export const getIsReleaseOpen = (release: EditableReleaseDocument): boolean =>
  release.state !== 'archived' && release.state !== 'published'

export function TitleDescriptionForm({
  release,
  onChange,
  disabled,
}: {
  release: EditableReleaseDocument
  onChange: (changedValue: EditableReleaseDocument) => void
  disabled?: boolean
}): React.JSX.Element {
  const isReleaseOpen = getIsReleaseOpen(release)
  const titleRef = useRef<HTMLTextAreaElement | null>(null)
  const descriptionRef = useRef<HTMLTextAreaElement | null>(null)

  const [scrollHeight, setScrollHeight] = useState(46)
  const [value, setValue] = useState<EditableReleaseDocument>({
    _id: release?._id,
    metadata: {
      title: release?.metadata.title,
      description: release?.metadata.description,
    },
  })
  const {t} = useTranslation()

  useEffect(() => {
    // make sure that the text area for the description has the right height initially
    if (descriptionRef.current) {
      setScrollHeight(descriptionRef.current.scrollHeight)
    }
    // Auto-resize title textarea
    if (titleRef.current) {
      titleRef.current.style.height = 'auto'
      titleRef.current.style.height = `${titleRef.current.scrollHeight}px`
    }
  }, [])

  useEffect(() => {
    setValue(release)
    // Auto-resize title textarea when value changes
    if (titleRef.current) {
      titleRef.current.style.height = 'auto'
      titleRef.current.style.height = `${titleRef.current.scrollHeight}px`
    }
  }, [release])

  const handleTitleChange = useCallback(
    (event: ChangeEvent<HTMLTextAreaElement>) => {
      event.preventDefault()
      const title = event.target.value
      onChange({...value, metadata: {...release.metadata, title}})
      // save the values to make input snappier while requests happen in the background
      setValue({...value, metadata: {...release.metadata, title}})

      // Auto-resize the textarea
      if (titleRef.current) {
        titleRef.current.style.height = 'auto'
        titleRef.current.style.height = `${titleRef.current.scrollHeight}px`
      }
    },
    [onChange, release.metadata, value],
  )

  const handleDescriptionChange = useCallback(
    (event: ChangeEvent<HTMLTextAreaElement>) => {
      event.preventDefault()
      if (!isReleaseOpen) return

      const description = event.target.value
      onChange({...value, metadata: {...release.metadata, description}})
      // save the values to make input snappier while requests happen in the background
      setValue({...value, metadata: {...release.metadata, description}})

      /** we must reset the height in order to make sure that if the text area shrinks,
       * that the actual input will change height as well */
      if (descriptionRef.current) {
        descriptionRef.current.style.overflow = 'hidden'
        descriptionRef.current.style.height = 'auto'
        descriptionRef.current.style.height = `${descriptionRef.current.scrollHeight}px`

        if (parseInt(descriptionRef.current.style.height, 10) > MAX_DESCRIPTION_HEIGHT) {
          descriptionRef.current.style.overflow = 'auto'
        }
      }

      setScrollHeight(event.currentTarget.scrollHeight)
    },
    [isReleaseOpen, onChange, release.metadata, value],
  )

  const shouldShowDescription = isReleaseOpen || value.metadata.description

  return (
    <Stack space={3}>
      <TitleTextArea
        ref={titleRef}
        onChange={handleTitleChange}
        value={value.metadata.title}
        placeholder={t('release.placeholder-untitled-release')}
        data-testid="release-form-title"
        readOnly={!isReleaseOpen}
        disabled={disabled}
      />
      {shouldShowDescription && (
        <DescriptionTextArea
          ref={descriptionRef}
          autoFocus={!value}
          value={value.metadata.description}
          placeholder={t('release.form.placeholder-describe-release')}
          onChange={handleDescriptionChange}
          style={{
            height: `${scrollHeight}px`,
            maxHeight: MAX_DESCRIPTION_HEIGHT,
          }}
          data-testid="release-form-description"
          disabled={disabled}
          readOnly={!isReleaseOpen}
        />
      )}
    </Stack>
  )
}
