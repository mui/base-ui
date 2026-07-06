import { Menu } from '@base-ui/react/menu'
import { Tabs } from '@base-ui/react/tabs'
import { Link } from '@tanstack/react-router'
import * as React from 'react'
import IconBrandAmp from '~icons/brand/amp.jsx'
import IconBrandCurlLight from '~icons/brand/curl-light.jsx'
import IconBrandCurl from '~icons/brand/curl.jsx'
import IconBrandCurlmd from '~icons/brand/curlmd.jsx'
import IconBrandOpencode from '~icons/brand/opencode.jsx'
import IconBrandPi from '~icons/brand/pi.jsx'
import IconOcticonDownload16 from '~icons/octicon/download16.jsx'
import IconOcticonPackage16 from '~icons/octicon/package16.jsx'
import IconSimpleIconsClaude from '~icons/simple-icons/claude.jsx'
import IconSimpleIconsCursor from '~icons/simple-icons/cursor.jsx'
import IconSimpleIconsNpm from '~icons/simple-icons/npm.jsx'
import IconSimpleIconsOpenai from '~icons/simple-icons/openai.jsx'
import { Sheep } from '#components/Sheep.tsx'
import { config } from '#docs/_config.ts'
import { useBrowserLayoutEffect } from '#hooks/useBrowserLayoutEffect.ts'
import { useCopyToClipboard } from '#hooks/useCopyToClipboard.ts'
import { getStepId, normalizeDocSearchHighlightTerms } from '#lib/docs.ts'
import {
  docSearchHighlightClassName,
  getDocSearchHighlightRanges,
  type Doc,
  type DocPagination,
} from './-utils.ts'

export function DocContent(props: {
  doc: Doc
  onCodeGroupValueChange?: ((value: string) => void) | undefined
  pagination?: DocPagination
  signedIn?: boolean
}) {
  const {
    doc,
    onCodeGroupValueChange,
    pagination = { next: undefined, previous: undefined },
    signedIn = false,
  } = props
  const { copied, copy } = useCopyToClipboard({ content: doc.source })
  const [activeHeadingId, setActiveHeadingId] = React.useState<string | undefined>(undefined)
  const [hydrated, setHydrated] = React.useState(false)
  const [mobileOutlineOpen, setMobileOutlineOpen] = React.useState(false)
  const [mobileOutlinePanelWidth, setMobileOutlinePanelWidth] = React.useState<number | undefined>(
    undefined,
  )
  const mobileOutlineContentRef = React.useRef<HTMLDivElement>(null)
  const mobileOutlineTriggerRef = React.useRef<HTMLButtonElement>(null)
  const honorHashUntilRef = React.useRef(0)
  const outlineHeadings = React.useMemo(
    () => doc.headings.filter((heading) => heading.level <= (doc.outlineMaxLevel ?? 4)),
    [doc.headings, doc.outlineMaxLevel],
  )
  const hasHeadings = outlineHeadings.length > 0
  const hasPagination = Boolean(pagination.previous || pagination.next)
  const activeHeading = outlineHeadings.find((heading) => heading.id === activeHeadingId)
  const editHref = `${config.repoBaseUrl}/edit/main/${doc.sourcePath}`
  const markdownHref = doc.path ? `/docs/${doc.path}.md` : '/docs/index.md'
  const lastUpdatedLabel = doc.lastUpdated
    ? formatLastUpdated(
        doc.lastUpdated,
        hydrated ? undefined : { locale: 'en-US', timeZone: 'UTC' },
      )
    : undefined
  const mdxComponents = React.useMemo(
    () => createMdxComponents({ copied, copyPage: copy, signedIn }),
    [copied, copy, signedIn],
  )
  const codeGroupStore = React.useMemo(
    () => createCodeGroupStore(onCodeGroupValueChange),
    [onCodeGroupValueChange],
  )

  const setHashOverride = React.useCallback(() => {
    honorHashUntilRef.current = window.performance.now() + hashHeadingGracePeriodMs
  }, [])

  const selectOutlineHeading = React.useCallback(
    (headingId: string) => {
      setHashOverride()
      setActiveHeadingId((current) => (current === headingId ? current : headingId))
    },
    [setHashOverride],
  )

  React.useEffect(() => {
    setHydrated(true)
  }, [])

  React.useEffect(() => {
    // Keep the shared tab store aligned with the URL for copied links and back/forward.
    codeGroupStore.syncFromUrl()
    const syncCodeGroupsFromUrl = () => codeGroupStore.syncFromUrl()
    window.addEventListener('popstate', syncCodeGroupsFromUrl)
    return () => window.removeEventListener('popstate', syncCodeGroupsFromUrl)
  }, [codeGroupStore])

  React.useEffect(() => {
    setMobileOutlineOpen(false)
  }, [doc.path])

  React.useEffect(() => {
    const closeMobileOutline = () => setMobileOutlineOpen(false)
    window.addEventListener('hashchange', closeMobileOutline)
    return () => window.removeEventListener('hashchange', closeMobileOutline)
  }, [])

  React.useEffect(() => {
    if (!hasHeadings) {
      setActiveHeadingId(undefined)
      return
    }

    const fixedNavbarHeightPx = 68
    const thresholdOffsetPx = 24

    const syncActiveHeading = () => {
      const headings = outlineHeadings
        .map((heading) => ({ element: document.getElementById(heading.id), id: heading.id }))
        .filter(
          (heading): heading is { element: HTMLElement; id: string } => heading.element !== null,
        )
        .map((heading) => ({ ...heading, top: getAbsoluteTop(heading.element) }))
        .filter((heading) => !Number.isNaN(heading.top))
      if (!headings.length) return

      const hashHeading = headings.find(
        (heading) => heading.id === decodeURIComponent(window.location.hash.slice(1)),
      )
      const hashHeadingId = hashHeading?.id
      const shouldHonorHash =
        hashHeadingId !== undefined && honorHashUntilRef.current > window.performance.now()

      if (window.scrollY < 1) {
        setActiveHeadingId((current) => (current === undefined ? current : undefined))
        return
      }

      let nextActiveHeadingId: string | undefined = undefined

      for (const heading of headings) {
        if (heading.top <= window.scrollY + fixedNavbarHeightPx + thresholdOffsetPx)
          nextActiveHeadingId = heading.id
        else break
      }

      if (
        shouldHonorHash &&
        hashHeading &&
        isHeadingVisibleInViewport(hashHeading.element, fixedNavbarHeightPx, thresholdOffsetPx)
      ) {
        nextActiveHeadingId = hashHeading.id
      }

      if (nextActiveHeadingId === undefined && shouldHonorHash) nextActiveHeadingId = hashHeadingId

      setActiveHeadingId((current) =>
        current === nextActiveHeadingId ? current : nextActiveHeadingId,
      )
    }

    let frameId: number | undefined

    const onScroll = () => {
      if (frameId !== undefined) return
      frameId = window.requestAnimationFrame(() => {
        frameId = undefined
        syncActiveHeading()
      })
    }

    const onHashChange = () => {
      setHashOverride()
      syncActiveHeading()
    }

    if (window.location.hash) setHashOverride()
    requestAnimationFrame(syncActiveHeading)
    window.addEventListener('hashchange', onHashChange)
    window.addEventListener('resize', syncActiveHeading)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      if (frameId !== undefined) window.cancelAnimationFrame(frameId)
      window.removeEventListener('hashchange', onHashChange)
      window.removeEventListener('resize', syncActiveHeading)
      window.removeEventListener('scroll', onScroll)
    }
  }, [doc.path, hasHeadings, outlineHeadings])

  useBrowserLayoutEffect(() => {
    const content = mobileOutlineContentRef.current
    if (!content || !hasHeadings) return

    const updatePanelWidth = () => {
      const nextWidth = Math.max(0, content.clientWidth - 32)
      setMobileOutlinePanelWidth((current) => (current === nextWidth ? current : nextWidth))
    }

    updatePanelWidth()

    const resizeObserver = new ResizeObserver(updatePanelWidth)
    resizeObserver.observe(content)
    return () => resizeObserver.disconnect()
  }, [hasHeadings])

  return (
    <codeGroupStoreContext.Provider value={codeGroupStore}>
      <div className="mx-auto grid w-full max-w-[76rem] grid-cols-1 lg:grid-cols-[minmax(0,56rem)_16rem] lg:gap-12">
        {hasHeadings && (
          <div
            className="bg-bg1 border-gray-a3 sticky top-17 z-30 w-full border-b md:[margin-inline:0] md:[margin-inline-start:-3rem] md:[inline-size:calc(100%+3rem)] lg:hidden"
            data-mobile-doc-outline-bar=""
          >
            <div
              className="mx-auto w-full max-w-[76rem] md:mx-0 md:max-w-none"
              ref={mobileOutlineContentRef}
            >
              <div className="flex items-center gap-4 px-4 py-2">
                <Menu.Root
                  modal={false}
                  onOpenChange={setMobileOutlineOpen}
                  open={mobileOutlineOpen}
                >
                  <div>
                    <Menu.Trigger
                      className="border-gray-a3 text-gray9 hover:bg-gray-a2 hover:text-gray10 data-[popup-open]:bg-gray-a2 data-[popup-open]:text-gray10 flex shrink-0 items-center gap-2.5 border px-2 py-2 text-xs font-medium outline-none"
                      data-mobile-doc-outline-trigger=""
                      ref={mobileOutlineTriggerRef}
                    >
                      <span>On this page</span>
                      <IconOcticonChevronRight16
                        aria-hidden
                        className={[
                          'size-3.5 shrink-0',
                          mobileOutlineOpen ? 'rotate-90' : undefined,
                        ]
                          .filter(Boolean)
                          .join(' ')}
                      />
                    </Menu.Trigger>
                  </div>

                  <Menu.Portal>
                    <Menu.Positioner
                      align="start"
                      anchor={mobileOutlineTriggerRef}
                      className="z-40 w-[var(--mobile-doc-outline-panel-width)] min-w-0 md:w-fit md:max-w-[min(var(--mobile-doc-outline-panel-width),36rem)] md:min-w-96 lg:hidden"
                      collisionAvoidance={{ align: 'none', fallbackAxisSide: 'none', side: 'none' }}
                      collisionPadding={0}
                      data-mobile-doc-outline-positioner=""
                      sideOffset={4}
                      style={
                        {
                          '--mobile-doc-outline-panel-width': mobileOutlinePanelWidth
                            ? `${mobileOutlinePanelWidth}px`
                            : 'calc(100vw - 2rem)',
                        } as React.CSSProperties
                      }
                    >
                      <Menu.Popup
                        className="bg-bg1 border-gray-a3 scrollbar-thumb-gray-a3 max-h-[min(24rem,calc(100dvh-9rem))] w-full scrollbar-thin scrollbar-track-transparent overflow-x-hidden overflow-y-auto overscroll-contain border p-0 shadow-2xl outline-none md:w-auto"
                        data-doc-mobile-outline-panel=""
                        id="docs-mobile-outline"
                      >
                        <Menu.Item
                          className="text-gray9 data-[active]:text-gray10 data-[highlighted]:bg-gray-a2 data-[highlighted]:text-gray10 focus-visible:ring-blue8 flex items-center gap-3 px-6 py-2.5 text-sm outline-none focus-visible:ring-1 focus-visible:outline-none focus-visible:ring-inset data-[active]:[background-color:var(--color-docs-code-surface)] dark:data-[active]:[background-color:var(--color-gray1)]"
                          closeOnClick
                          data-active={activeHeadingId === undefined ? '' : undefined}
                          onClick={(event) => {
                            event.preventDefault()
                            window.history.pushState(null, '', getDocHref(doc.path))
                            setActiveHeadingId(undefined)
                            setMobileOutlineOpen(false)
                            window.scrollTo({ top: 0 })
                          }}
                          render={<a href={getDocHref(doc.path)} />}
                        >
                          <span className="min-w-0 flex-1 truncate text-left text-sm font-medium">
                            Overview
                          </span>
                          {activeHeadingId === undefined && (
                            <IconOcticonCheck16 className="text-blue9 size-4 shrink-0" />
                          )}
                        </Menu.Item>

                        <div aria-hidden="true" className="border-gray-a3 border-t" />

                        {outlineHeadings.map((heading, index) => (
                          <React.Fragment key={heading.id}>
                            {index > 0 && (
                              <div aria-hidden="true" className="border-gray-a3 border-t" />
                            )}
                            <Menu.Item
                              className="text-gray9 data-[active]:text-gray10 data-[highlighted]:bg-gray-a2 data-[highlighted]:text-gray10 focus-visible:ring-blue8 flex items-center gap-3 px-6 py-2.5 text-sm outline-none focus-visible:ring-1 focus-visible:outline-none focus-visible:ring-inset data-[active]:[background-color:var(--color-docs-code-surface)] dark:data-[active]:[background-color:var(--color-gray1)]"
                              closeOnClick
                              data-active={activeHeadingId === heading.id ? '' : undefined}
                              onClick={() => {
                                selectOutlineHeading(heading.id)
                                setMobileOutlineOpen(false)
                              }}
                              render={<a href={`#${heading.id}`} />}
                            >
                              <span
                                className="min-w-0 flex-1 text-left"
                                style={{ paddingInlineStart: `${(heading.level - 2) * 1}rem` }}
                              >
                                <OutlineHeadingText text={heading.text} truncate />
                              </span>
                              {activeHeadingId === heading.id && (
                                <IconOcticonCheck16 className="text-blue9 size-4 shrink-0" />
                              )}
                            </Menu.Item>
                          </React.Fragment>
                        ))}
                      </Menu.Popup>
                    </Menu.Positioner>
                  </Menu.Portal>
                </Menu.Root>

                <p
                  className="text-gray10 min-w-0 flex-1 truncate text-xs font-medium"
                  data-mobile-doc-outline-current-heading=""
                >
                  {activeHeading?.text ?? 'Overview'}
                </p>
              </div>
            </div>
          </div>
        )}

        <article className="min-w-0 px-5 py-8 text-[0.9375rem] md:px-12 md:max-lg:-ms-12 md:max-lg:w-[calc(100%+3rem)] md:max-lg:px-8 lg:mx-auto lg:w-full lg:max-w-2xl lg:px-0 lg:pt-12">
          <doc.Component components={mdxComponents} />

          {(doc.lastUpdated || hasPagination) && (
            <div className="mt-14">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <a
                  className="text-gray9 hover:text-gray10 flex items-center gap-2 text-sm font-medium select-none"
                  href={editHref}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <IconOcticonPencil16 className="size-4 shrink-0" />
                  <span className="select-none">Edit page</span>
                </a>

                {doc.lastUpdated && (
                  <p className="text-gray9 text-sm">
                    {lastUpdatedLabel ? `Last updated: ${lastUpdatedLabel}` : ''}
                  </p>
                )}
              </div>

              {hasPagination && (
                <nav className="border-gray-a3 mt-4 grid gap-4 border-t pt-4 sm:grid-cols-2">
                  {pagination.previous ? (
                    <DocPaginationLink direction="previous" doc={pagination.previous} />
                  ) : (
                    <div className="hidden sm:block" />
                  )}
                  {pagination.next && <DocPaginationLink direction="next" doc={pagination.next} />}
                </nav>
              )}
            </div>
          )}
        </article>

        <aside className="group border-gray-a3 hidden w-64 border-s lg:block">
          <div className="scrollbar-thumb-gray-a3 sticky top-17 flex h-[calc(100dvh-4.25rem)] scrollbar-thin scrollbar-track-transparent flex-col overflow-y-auto py-8 ps-6 pe-6">
            <div>
              {hasHeadings && (
                <>
                  <div className="text-gray9 flex items-center gap-2 text-xs font-medium tracking-wide uppercase">
                    <IconOcticonListUnordered24 aria-hidden className="size-4 shrink-0" />
                    <p>On this page</p>
                  </div>
                  <DesktopDocOutline
                    activeHeadingId={activeHeadingId}
                    headings={outlineHeadings}
                    onHeadingSelect={selectOutlineHeading}
                  />
                </>
              )}

              <div
                className="data-[has-headings]:border-gray-a3 data-[has-headings]:mt-4 data-[has-headings]:border-t data-[has-headings]:pt-4"
                data-has-headings={hasHeadings ? '' : undefined}
              >
                <div className="flex flex-col gap-1">
                  <CopyPageButton
                    className="text-gray9 hover:text-gray10 -ms-2 hidden py-1 ps-2 text-sm lg:flex"
                    copyPage={copy}
                    copied={copied}
                  />

                  <a
                    className="text-gray9 hover:text-gray10 -ms-2 flex items-center gap-2.5 py-1 ps-2 text-sm select-none"
                    href={markdownHref}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    <IconOcticonMarkdown16 className="size-4 shrink-0" />
                    <span>View markdown</span>
                  </a>

                  <a
                    className="text-gray9 hover:text-gray10 -ms-2 flex items-center gap-2.5 py-1 ps-2 text-sm select-none"
                    href={`${config.repoBaseUrl}/issues/new/choose`}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    <IconOcticonMarkGithub16 className="size-4 shrink-0" />
                    <span>Report issue</span>
                  </a>

                  <a
                    className="text-gray9 hover:text-gray10 -ms-2 flex items-center gap-2.5 py-1 ps-2 text-sm select-none"
                    href={editHref}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    <IconOcticonPencil16 className="size-4 shrink-0" />
                    <span className="select-none">Edit page</span>
                  </a>
                </div>
              </div>
            </div>

            <div className="mt-auto flex justify-start ps-2 pt-6">
              <Sheep.Root className="opacity-[0.35] grayscale transition-[filter,opacity] group-focus-within:opacity-100 group-focus-within:grayscale-0 group-hover:opacity-100 group-hover:grayscale-0 data-[sheep-animating]:opacity-100 data-[sheep-animating]:grayscale-0" />
            </div>
          </div>
        </aside>
      </div>
    </codeGroupStoreContext.Provider>
  )
}

export function DocSearchPreview(props: {
  doc: Pick<Doc, 'Component' | 'path'>
  hash?: string | undefined
  terms?: Array<string> | undefined
}) {
  const mdxComponents = React.useMemo(
    () =>
      createMdxComponents({
        copied: false,
        copyPage: () => undefined,
        preview: true,
        previewTerms: props.terms,
      }),
    [props.terms],
  )
  const contentRef = React.useRef<HTMLDivElement>(null)
  const viewportRef = React.useRef<HTMLDivElement>(null)
  const [offsetTop, setOffsetTop] = React.useState(0)
  const previewMaskImage =
    offsetTop > 0
      ? 'linear-gradient(to bottom, transparent 0%, black 10%, black 82%, transparent 100%)'
      : 'linear-gradient(to bottom, black 0%, black 82%, transparent 100%)'

  useBrowserLayoutEffect(() => {
    const content = contentRef.current
    const viewport = viewportRef.current
    if (!content || !viewport) return

    const updateOffset = () => {
      clearDocSearchPreviewHighlights(content)
      highlightDocSearchPreview(content, props.terms)

      const anchor = getDocSearchPreviewAnchor(content, props.hash)
      if (!anchor) {
        setOffsetTop(0)
        return
      }

      const maxOffset = Math.max(0, content.scrollHeight - viewport.clientHeight)
      const nextOffset = Math.min(
        maxOffset,
        Math.max(0, anchor.offsetTop - docSearchPreviewOffsetTopPx),
      )
      setOffsetTop((current) => (current === nextOffset ? current : nextOffset))
    }

    updateOffset()

    const resizeObserver = new ResizeObserver(updateOffset)
    resizeObserver.observe(content)
    resizeObserver.observe(viewport)
    return () => resizeObserver.disconnect()
  }, [props.doc.path, props.hash, props.terms])

  return (
    <div
      aria-hidden="true"
      className="relative max-h-40 overflow-hidden"
      data-doc-search-preview=""
      ref={viewportRef}
      style={{ WebkitMaskImage: previewMaskImage, maskImage: previewMaskImage }}
    >
      <div
        className="text-gray10 pointer-events-none ps-2 pe-1 select-none [&_[data-docs-code-block]]:mt-2.5 [&_[data-docs-step]:first-child]:pt-0 [&_[data-docs-steps]]:mt-2.5 [&>*:first-child]:mt-0"
        ref={contentRef}
        style={offsetTop ? { transform: `translateY(-${offsetTop}px)` } : undefined}
      >
        <props.doc.Component components={mdxComponents} />
      </div>
    </div>
  )
}

// --- Internal ---

function createMdxComponents(props: {
  copied: boolean
  copyPage: () => void
  preview?: boolean
  previewTerms?: Array<string> | undefined
  signedIn?: boolean
}) {
  const { copied, copyPage, preview = false, previewTerms, signedIn = false } = props
  const docsInlineLinkClassName =
    'text-[color-mix(in_oklab,var(--color-gray10)_45%,var(--color-gray9))] underline [text-decoration-color:var(--color-gray-a6)] underline-offset-2 hover:text-gray10 [overflow-wrap:anywhere]'

  return {
    Card: ((cardProps: React.PropsWithChildren<{ href: string; icon?: string; title: string }>) => (
      <DocsCard preview={preview} {...cardProps} />
    )) as React.ComponentType<any>,
    Cards: ((cardsProps: React.PropsWithChildren) => (
      <DocsCards preview={preview} {...cardsProps} />
    )) as React.ComponentType<any>,
    BrandAssets,
    CodeGroup: preview
      ? (codeGroupProps: React.PropsWithChildren) => (
          <PreviewCodeGroup terms={previewTerms} {...codeGroupProps} />
        )
      : CodeGroup,
    CodeGroupItem,
    pre: (preProps: React.ComponentProps<'pre'>) => (
      <DocsCodeBlock preview={preview} {...preProps} />
    ),
    Notice: ((noticeProps: React.PropsWithChildren<{ title?: string; type?: string }>) => (
      <Notice preview={preview} {...noticeProps} />
    )) as React.ComponentType<any>,
    PackageLinks: ((packageLinksProps: {
      npm: string
      source: string
      version?: string | undefined
    }) => (
      <DocsPackageLinks preview={preview} {...packageLinksProps} />
    )) as React.ComponentType<any>,
    SignedOutOnly: ((signedOutOnlyProps: React.PropsWithChildren) =>
      signedIn ? null : <>{signedOutOnlyProps.children}</>) as React.ComponentType<any>,
    Step,
    Steps: (stepsProps: React.PropsWithChildren) => <Steps preview={preview} {...stepsProps} />,
    table: (tableProps: React.ComponentProps<'table'>) => (
      <DocsTable preview={preview} {...tableProps} />
    ),
    tbody: DocsTableBody,
    td: (cellProps: React.ComponentProps<'td'>) => (
      <DocsTableCell preview={preview} {...cellProps} />
    ),
    th: (cellProps: React.ComponentProps<'th'>) => (
      <DocsTableHeaderCell preview={preview} {...cellProps} />
    ),
    thead: DocsTableHead,
    tr: DocsTableRow,
    a: (anchorProps: React.ComponentProps<'a'>) => {
      const { href, children, ...rest } = anchorProps
      if (preview) return <span className={docsInlineLinkClassName}>{children}</span>
      if (!preview && href?.startsWith('/'))
        return (
          <Link className={docsInlineLinkClassName} to={href}>
            {children}
          </Link>
        )
      return (
        <a className={docsInlineLinkClassName} href={href} {...rest}>
          {children}
        </a>
      )
    },
    blockquote: (blockquoteProps: React.ComponentProps<'blockquote'>) => (
      <blockquote
        className={[
          'border-gray-a4 border-s-4 [background-color:var(--color-docs-code-surface)] text-[color-mix(in_oklab,var(--color-gray10)_25%,var(--color-gray9))] [&>p]:mt-0',
          preview
            ? 'mt-3 px-4 py-3 [&>p]:leading-[1.45] [&>p+p]:mt-2.5'
            : 'mt-4 px-5 py-4 [&>p]:leading-relaxed [&>p+p]:mt-3',
        ]
          .filter(Boolean)
          .join(' ')}
        {...blockquoteProps}
      />
    ),
    code: DocsInlineCode,
    h1: (headingProps: React.ComponentProps<'h1'>) =>
      renderPageHeading({ copied, copyPage, preview, ...headingProps }),
    h2: (headingProps: React.ComponentProps<'h2'>) =>
      renderDocHeading('h2', headingProps, {
        className: getDocHeadingClassName('h2', { preview }),
        preview,
      }),
    h3: (headingProps: React.ComponentProps<'h3'>) =>
      renderDocHeading('h3', headingProps, {
        className: getDocHeadingClassName('h3', { preview }),
        preview,
      }),
    h4: (headingProps: React.ComponentProps<'h4'>) =>
      renderDocHeading('h4', headingProps, {
        className: getDocHeadingClassName('h4', { preview }),
        preview,
      }),
    h5: (headingProps: React.ComponentProps<'h5'>) =>
      renderDocHeading('h5', headingProps, {
        className: getDocHeadingClassName('h5', { preview }),
        preview,
      }),
    hr: () => <hr className="border-gray-a3 my-8" />,
    li: (listItemProps: React.ComponentProps<'li'>) => (
      <li
        className={[
          'text-[color-mix(in_oklab,var(--color-gray10)_25%,var(--color-gray9))]',
          preview ? 'leading-[1.45]' : 'leading-relaxed',
        ]
          .filter(Boolean)
          .join(' ')}
        {...listItemProps}
      />
    ),
    ol: (listProps: React.ComponentProps<'ol'>) => (
      <ol
        className={[
          'list-decimal text-[color-mix(in_oklab,var(--color-gray10)_25%,var(--color-gray9))]',
          preview ? 'mt-3 space-y-0.5 ps-5' : 'mt-4 space-y-1 ps-7',
        ]
          .filter(Boolean)
          .join(' ')}
        {...listProps}
      />
    ),
    p: (paragraphProps: React.ComponentProps<'p'>) => (
      <p
        className={[
          'text-[color-mix(in_oklab,var(--color-gray10)_25%,var(--color-gray9))]',
          preview ? 'mt-3 leading-[1.45]' : 'mt-4 leading-relaxed',
        ]
          .filter(Boolean)
          .join(' ')}
        {...paragraphProps}
      />
    ),
    ul: (listProps: React.ComponentProps<'ul'>) => (
      <ul
        className={[
          "[&>li]:before:text-gray9 list-none ps-0 text-[color-mix(in_oklab,var(--color-gray10)_25%,var(--color-gray9))] [&>li]:relative [&>li]:before:absolute [&>li]:before:content-['-'] [&>li]:before:start-0 [&>li]:before:top-0",
          preview ? 'mt-3 space-y-0.5 [&>li]:ps-5' : 'mt-4 space-y-1 [&>li]:ps-6',
        ]
          .filter(Boolean)
          .join(' ')}
        {...listProps}
      />
    ),
  }
}

function Flock() {
  return (
    <div className="not-prose mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
      {Sheep.variants.map((variant) => (
        <div className="flex flex-col items-center justify-center p-2" key={variant}>
          <div className="flex size-24 items-center justify-center" style={checkerboardStyle}>
            <img
              alt={`${variant} sheep`}
              className="size-20 [image-rendering:pixelated]"
              src={`/sheep/static/${variant}.png`}
            />
          </div>
          <p className="text-gray8 mt-3 text-sm capitalize">{variant}</p>
        </div>
      ))}
    </div>
  )
}

function Logo() {
  return (
    <div className="not-prose mt-4 grid gap-4 md:grid-cols-2">
      <BrandLogoCard tone="dark" />
      <BrandLogoCard tone="light" />
    </div>
  )
}

const BrandAssets = { Flock, Logo }

function BrandLogoCard(props: { tone: 'dark' | 'light' }) {
  return (
    <div
      className="flex aspect-[16/9] items-center justify-center p-8"
      style={{ ...checkerboardStyle, colorScheme: props.tone }}
    >
      <IconBrandCurlmd
        aria-label={`curl.md ${props.tone} logo`}
        className="text-gray10 h-auto w-full max-w-[24rem]"
      />
    </div>
  )
}

const checkerboardStyle = {
  backgroundColor: 'var(--color-bg1)',
  backgroundImage:
    'linear-gradient(45deg, var(--color-gray-a1) 25%, transparent 25%), linear-gradient(-45deg, var(--color-gray-a1) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, var(--color-gray-a1) 75%), linear-gradient(-45deg, transparent 75%, var(--color-gray-a1) 75%)',
  backgroundPosition: '0 0, 0 0.5rem, 0.5rem -0.5rem, -0.5rem 0',
  backgroundSize: '1rem 1rem',
} satisfies React.CSSProperties

function CopyPageButton(
  props: {
    className: string
    copyPage: () => void
    copied: boolean
  } & React.ComponentProps<'button'>,
) {
  const { className, copied, copyPage, ...rest } = props

  return (
    <button
      {...rest}
      className={['flex select-none items-center gap-2.5 text-left', className]
        .filter(Boolean)
        .join(' ')}
      onClick={() => copyPage()}
      type="button"
    >
      {copied ? (
        <IconOcticonCheck16 className="text-teal9 size-4 shrink-0" />
      ) : (
        <IconOcticonCopy16 className="size-4 shrink-0" />
      )}
      <span>Copy page</span>
    </button>
  )
}

function DesktopDocOutline(props: {
  activeHeadingId: string | undefined
  headings: Array<{ id: string; level: number; text: string }>
  onHeadingSelect: (headingId: string) => void
}) {
  const { activeHeadingId, headings, onHeadingSelect } = props

  return (
    <ul className="mt-3 flex flex-col gap-1">
      {headings.map((heading) => (
        <li key={heading.id} style={{ paddingInlineStart: `${(heading.level - 2) * 0.75}rem` }}>
          <a
            aria-current={activeHeadingId === heading.id ? 'location' : undefined}
            className="text-gray9 hover:text-gray10 hover:bg-gray-a2 data-[active]:text-gray10 -ms-2 block py-1 ps-2 pe-2 text-sm data-[active]:[background-color:var(--color-docs-code-surface)] dark:data-[active]:[background-color:var(--color-gray1)]"
            data-active={activeHeadingId === heading.id ? '' : undefined}
            href={`#${heading.id}`}
            onMouseDown={() => onHeadingSelect(heading.id)}
            onClick={() => onHeadingSelect(heading.id)}
          >
            <OutlineHeadingText text={heading.text} />
          </a>
        </li>
      ))}
    </ul>
  )
}

function OutlineHeadingText(props: { text: string; truncate?: boolean }) {
  const { text, truncate } = props
  const numberedHeading = splitNumberedHeading(text)
  if (!numberedHeading)
    return <span className={truncate ? 'block truncate' : undefined}>{text}</span>

  return (
    <span className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-2">
      <span className="shrink-0">{numberedHeading.number}</span>
      <span className={truncate ? 'truncate' : undefined}>{numberedHeading.title}</span>
    </span>
  )
}

function renderDocHeading<Tag extends 'h2' | 'h3' | 'h4' | 'h5'>(
  tag: Tag,
  props: React.ComponentProps<Tag>,
  options: { className: string; linked?: boolean; preview?: boolean },
) {
  const { className: baseClassName, linked = true, preview = false } = options
  const { children, className, id, ...rest } = props
  const headingClassName = [
    'group/heading relative text-gray12',
    !preview && linked ? '-ms-4 ps-4 md:-ms-5 md:ps-5' : undefined,
    baseClassName,
    className,
  ]
    .filter(Boolean)
    .join(' ')

  if (preview) {
    return React.createElement(
      tag,
      {
        ...rest,
        className: headingClassName,
        ...(id ? { 'data-doc-search-anchor': id } : {}),
      },
      <>{children}</>,
    )
  }

  return React.createElement(
    tag,
    {
      ...rest,
      className: headingClassName,
      ...(id ? { id } : {}),
    },
    <>
      {!preview && linked && id ? <HeadingAnchorLink id={id} /> : null}
      {children}
    </>,
  )
}

function getDocHeadingClassName(
  tag: 'h2' | 'h3' | 'h4' | 'h5',
  props: { preview?: boolean; tight?: boolean; withMargin?: boolean },
) {
  const { preview = false, tight = false, withMargin = true } = props

  if (tag === 'h2') {
    return [
      withMargin ? (preview ? 'mt-7' : 'mt-12') : undefined,
      'scroll-mt-[7rem] font-bold lg:scroll-mt-4',
      preview ? 'text-base md:text-lg' : 'text-lg md:text-xl',
      tight ? 'leading-tight' : undefined,
    ]
      .filter(Boolean)
      .join(' ')
  }

  if (tag === 'h3') {
    return [
      withMargin ? (preview ? 'mt-6' : 'mt-10') : undefined,
      'scroll-mt-[7rem] font-bold lg:scroll-mt-5',
      preview ? 'text-[0.9375rem] md:text-base' : 'text-base md:text-lg',
      tight ? 'leading-tight' : undefined,
    ]
      .filter(Boolean)
      .join(' ')
  }

  if (tag === 'h4') {
    return [
      withMargin ? (preview ? 'mt-5' : 'mt-8') : undefined,
      'scroll-mt-[7rem] font-bold lg:scroll-mt-4',
      preview ? 'text-[0.8125rem] md:text-sm' : 'text-sm md:text-base',
      tight ? 'leading-tight' : undefined,
    ]
      .filter(Boolean)
      .join(' ')
  }

  return [
    withMargin ? (preview ? 'mt-4' : 'mt-6') : undefined,
    'scroll-mt-[7rem] font-bold lg:scroll-mt-4',
    preview ? 'text-[0.75rem] md:text-[0.8125rem]' : 'text-[0.8125rem] md:text-sm',
    tight ? 'leading-tight' : undefined,
  ]
    .filter(Boolean)
    .join(' ')
}

function renderPageHeading(
  props: React.ComponentProps<'h1'> & {
    copied: boolean
    copyPage: () => void
    preview?: boolean
  },
) {
  const { children, className, copied, copyPage, id, preview = false, ...rest } = props

  if (preview)
    return (
      <h1
        {...rest}
        className={[
          'text-gray12 min-w-0 scroll-mt-[7rem] text-lg font-bold lg:scroll-mt-0 md:text-xl',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        {...(id ? { 'data-doc-search-anchor': id } : {})}
      >
        {children}
      </h1>
    )

  return (
    <h1
      {...rest}
      className={[
        'text-gray12 flex items-start justify-between gap-4 scroll-mt-[7rem] text-[1.375rem] font-bold lg:scroll-mt-0 md:text-[1.625rem]',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      id={id}
    >
      <span className="group/heading relative -ms-4 min-w-0 flex-1 ps-4 md:-ms-5 md:ps-5">
        {id ? <HeadingAnchorLink dataHeadingAnchor id={id} /> : null}

        <span className="block min-w-0" data-heading-title="">
          {children}
        </span>
      </span>

      <CopyPageButton
        className="text-gray8 hover:text-gray10 mt-1 self-start text-sm lg:hidden"
        copyPage={copyPage}
        copied={copied}
        data-doc-mobile-copy-page=""
      />
    </h1>
  )
}

function HeadingAnchorLink(props: { dataHeadingAnchor?: boolean; id: string }) {
  const { dataHeadingAnchor = false, id } = props

  return (
    <a
      aria-label="Link to section"
      className="text-gray7 hover:text-gray9 focus-visible:text-gray9 absolute start-0 top-1/2 -translate-y-1/2 font-normal no-underline opacity-0 transition-opacity group-focus-within/heading:opacity-100 group-hover/heading:opacity-100 hover:opacity-100 focus:opacity-100"
      {...(dataHeadingAnchor ? { 'data-heading-anchor': '' } : {})}
      href={`#${id}`}
    >
      #
    </a>
  )
}

function DocsInlineCode(props: React.ComponentProps<'code'>) {
  return (
    <code
      {...props}
      className={['bg-gray-a2 px-1 py-0.5 text-[0.9375em]', props.className]
        .filter(Boolean)
        .join(' ')}
    />
  )
}

function Notice(
  props: React.PropsWithChildren<{ preview?: boolean; title?: string; type?: string }>,
) {
  const { children, preview = false, title, type = 'note' } = props
  const label = title ?? noticeTitles[type] ?? noticeTitles.note
  const noticeClassName = [
    'data-[type=caution]:border-red9/30 data-[type=caution]:bg-red9/8 data-[type=hint]:border-blue9/30 data-[type=hint]:bg-blue9/8 data-[type=important]:border-purple9/30 data-[type=important]:bg-purple9/8 data-[type=note]:border-blue9/30 data-[type=note]:bg-blue9/8 data-[type=tip]:border-green9/30 data-[type=tip]:bg-green9/8 data-[type=warning]:border-amber9/30 data-[type=warning]:bg-amber9/8 border',
    preview ? 'mt-4 p-3 text-[0.8125rem]' : 'mt-6 p-4 text-[0.9375rem]',
  ]
    .filter(Boolean)
    .join(' ')
  const badgeClassName = [
    'data-[type=caution]:border-red9/30 data-[type=caution]:bg-red9/8 data-[type=caution]:text-red9 data-[type=hint]:border-blue9/30 data-[type=hint]:bg-blue9/8 data-[type=hint]:text-blue9 data-[type=important]:border-purple9/30 data-[type=important]:bg-purple9/8 data-[type=important]:text-purple9 data-[type=note]:border-blue9/30 data-[type=note]:bg-blue9/8 data-[type=note]:text-blue9 data-[type=tip]:border-green9/30 data-[type=tip]:bg-green9/8 data-[type=tip]:text-green9 data-[type=warning]:border-amber9/30 data-[type=warning]:bg-amber9/8 data-[type=warning]:text-amber9 inline-flex items-center border',
    preview ? 'gap-1 px-1.5 py-0.5' : 'gap-1.5 px-1.5 py-0.5',
  ]
    .filter(Boolean)
    .join(' ')
  const labelClassName = [
    'mt-0 font-medium tracking-wide uppercase',
    preview ? 'text-[0.625rem]' : 'text-[0.6875rem]',
  ]
    .filter(Boolean)
    .join(' ')
  const bodyClassName = [
    '[&>*:last-child]:mb-0',
    preview ? '[&>*:first-child]:mt-2.5' : '[&>*:first-child]:mt-3',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={noticeClassName} data-type={type} role="note">
      <div className={badgeClassName} data-type={type}>
        <NoticeIcon type={type} />
        <p className={labelClassName}>{label}</p>
      </div>

      <div className={bodyClassName}>{children}</div>
    </div>
  )
}

function DocsTable(props: React.ComponentProps<'table'> & { preview?: boolean }) {
  const { preview, ...rest } = props
  const containerClassName = [
    'scrollbar-thin scrollbar-thumb-gray-a3 scrollbar-track-transparent',
    preview ? 'mt-4 overflow-x-hidden' : 'mt-6 overflow-x-auto',
  ]
    .filter(Boolean)
    .join(' ')
  const tableClassName = [
    'min-w-full border-collapse',
    preview ? 'text-[0.8125rem]' : 'text-[0.9375rem]',
    rest.className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={containerClassName} data-docs-table="">
      <table {...rest} className={tableClassName} />
    </div>
  )
}

function DocsTableHead(props: React.ComponentProps<'thead'>) {
  return (
    <thead
      className={['border-gray-a3 border-b', props.className].filter(Boolean).join(' ')}
      {...props}
    />
  )
}

function DocsTableBody(props: React.ComponentProps<'tbody'>) {
  return <tbody className={props.className} {...props} />
}

function DocsTableRow(props: React.ComponentProps<'tr'>) {
  return (
    <tr
      className={['border-gray-a3 border-b', props.className].filter(Boolean).join(' ')}
      {...props}
    />
  )
}

function DocsTableHeaderCell(props: React.ComponentProps<'th'> & { preview?: boolean }) {
  const { preview, ...rest } = props
  return (
    <th
      {...rest}
      className={[
        '[background-color:var(--color-docs-code-surface)] text-gray10 text-left font-medium whitespace-nowrap',
        preview ? 'px-3 py-2.5' : 'px-4 py-3',
        rest.className,
      ]
        .filter(Boolean)
        .join(' ')}
    />
  )
}

function DocsTableCell(props: React.ComponentProps<'td'> & { preview?: boolean }) {
  const { preview, ...rest } = props
  return (
    <td
      {...rest}
      className={[
        'text-[color-mix(in_oklab,var(--color-gray10)_25%,var(--color-gray9))] align-top whitespace-nowrap',
        preview ? 'px-3 py-2.5' : 'px-4 py-3',
        rest.className,
      ]
        .filter(Boolean)
        .join(' ')}
    />
  )
}

function DocsPackageLinks(props: {
  npm: string
  preview?: boolean
  source: string
  version?: string | undefined
}) {
  const { npm, preview = false, source, version } = props
  return (
    <div
      className={['flex flex-wrap items-center', preview ? 'mt-3 gap-2' : 'mt-4 gap-2.5']
        .filter(Boolean)
        .join(' ')}
      data-docs-button-links=""
    >
      <DocsButtonLink href={getNpmPackageHref(npm)} icon="npm" preview={preview}>
        <span className="truncate leading-none">
          {npm}
          {version ? `@${version}` : ''}
        </span>
      </DocsButtonLink>

      <DocsButtonLink href={source} icon="github" preview={preview}>
        Source code
      </DocsButtonLink>
    </div>
  )
}

function DocsButtonLink(
  props: React.PropsWithChildren<{ href: string; icon?: 'github' | 'npm'; preview?: boolean }>,
) {
  const { children, href, icon, preview = false } = props
  const iconDefinition = getDocsButtonLinkIcon(icon)
  const className = [
    'border-gray-a1 [background-color:var(--color-docs-surface)] text-gray9 inline-flex max-w-full min-w-0 items-center border no-underline select-none',
    preview ? 'h-8 gap-1.5 px-2 text-[0.75rem]' : 'h-9 gap-2 px-2.5 text-sm',
    preview
      ? 'pointer-events-none'
      : 'hover:bg-gray-a2 hover:text-gray10 focus-visible:text-gray10 focus-visible:ring-blue8 outline-none focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-inset',
  ]
    .filter(Boolean)
    .join(' ')
  const content = (
    <>
      {iconDefinition && (
        <span
          className={[
            'inline-flex shrink-0 items-center justify-center',
            preview ? 'size-3.5' : 'size-4',
            'className' in iconDefinition ? iconDefinition.className : undefined,
          ]
            .filter(Boolean)
            .join(' ')}
        >
          <iconDefinition.Component
            aria-hidden
            className={preview ? 'size-3.5 shrink-0' : 'size-4 shrink-0'}
          />
        </span>
      )}
      <span className="min-w-0 truncate leading-none">{children}</span>
    </>
  )

  if (preview)
    return (
      <span className={className} data-docs-button-link="">
        {content}
      </span>
    )

  if (href.startsWith('/'))
    return (
      <Link className={className} data-docs-button-link="" to={href}>
        {content}
      </Link>
    )

  return (
    <a
      className={className}
      data-docs-button-link=""
      href={href}
      rel="noopener noreferrer"
      target="_blank"
    >
      {content}
    </a>
  )
}

function DocsCards(props: React.PropsWithChildren<{ preview?: boolean }>) {
  const { children, preview = false } = props

  return (
    <div
      className={[
        'grid grid-cols-1 md:grid-cols-2',
        preview ? 'mt-4 mb-4 gap-3' : 'mt-6 mb-6 gap-4',
      ]
        .filter(Boolean)
        .join(' ')}
      data-docs-cards=""
    >
      {children}
    </div>
  )
}

function DocsCard(
  props: React.PropsWithChildren<{ href: string; icon?: string; preview?: boolean; title: string }>,
) {
  const { children, href, icon, preview = false, title } = props
  const iconDefinition = getDocsCardIcon(icon)
  const className = [
    'border-gray-a1 [background-color:var(--color-docs-surface)] text-gray10 flex h-full flex-col border no-underline',
    preview ? 'gap-2.5 p-3' : 'gap-3 p-4 hover:bg-gray-a2',
  ]
    .filter(Boolean)
    .join(' ')
  const content = (
    <>
      {iconDefinition && (
        <span
          className={[
            'bg-gray-a2 text-gray11 inline-flex items-center justify-center',
            preview ? 'size-8' : 'size-9',
          ]
            .filter(Boolean)
            .join(' ')}
          data-docs-card-icon=""
        >
          <iconDefinition.Component
            aria-hidden
            className={[
              preview ? 'h-4 w-auto max-w-full' : 'h-4.5 w-auto max-w-full',
              'className' in iconDefinition ? iconDefinition.className : undefined,
            ]
              .filter(Boolean)
              .join(' ')}
          />
        </span>
      )}

      <div className="min-w-0">
        <p
          className={['text-gray12 mt-0 font-medium', preview ? 'text-[0.9375rem]' : 'text-base']
            .filter(Boolean)
            .join(' ')}
          data-docs-card-title=""
        >
          {title}
        </p>

        <div
          className={[
            'min-w-0 text-[color-mix(in_oklab,var(--color-gray10)_25%,var(--color-gray9))] [&>*:first-child]:mt-2 [&>*:last-child]:mb-0',
            preview ? 'text-[0.75rem]' : 'text-[0.8125rem]',
          ]
            .filter(Boolean)
            .join(' ')}
          data-docs-card-body=""
        >
          {children}
        </div>
      </div>
    </>
  )

  if (preview)
    return (
      <div className={className} data-docs-card="">
        {content}
      </div>
    )

  if (href.startsWith('/'))
    return (
      <Link className={className} data-docs-card="" to={href}>
        {content}
      </Link>
    )

  return (
    <a className={className} data-docs-card="" href={href}>
      {content}
    </a>
  )
}

function Steps(props: React.PropsWithChildren<{ preview?: boolean }>) {
  const { children, preview = false } = props
  const items = getStepItems(children)
  const contentClassName = preview
    ? '[&>*:first-child]:mt-3 [&>*:last-child]:mb-0'
    : '[&>*:first-child]:mt-4 [&>*:last-child]:mb-0'

  if (!items[0]) return <>{children}</>

  return (
    <ol
      className={['-ms-1 list-none ps-0', preview ? 'mt-4' : 'mt-6'].filter(Boolean).join(' ')}
      data-docs-steps=""
    >
      {items.map((item, index) => (
        <li
          className={[
            'grid last:pb-0',
            preview
              ? 'grid-cols-[1.75rem_minmax(0,1fr)] gap-2.5 pb-6 md:grid-cols-[2rem_minmax(0,1fr)] md:gap-3'
              : 'grid-cols-[2rem_minmax(0,1fr)] gap-3 pb-10 md:grid-cols-[2.25rem_minmax(0,1fr)] md:gap-4',
          ]
            .filter(Boolean)
            .join(' ')}
          data-docs-step=""
          key={`${index}-${item.title}`}
        >
          <div className="relative -mt-px flex justify-center md:-mt-0.5">
            {preview ? (
              <span className="text-gray11 relative z-10 flex size-5 items-center justify-center rounded-full [background-color:var(--color-docs-code-surface)] text-[0.75rem] font-medium md:size-6 md:text-[0.8125rem]">
                {index + 1}
              </span>
            ) : (
              <a
                aria-label={`Link to step: ${item.title}`}
                className="text-gray11 hover:bg-gray-a4 hover:text-gray12 focus-visible:ring-blue8 relative z-10 flex size-6 items-center justify-center rounded-full [background-color:var(--color-docs-code-surface)] text-[0.875rem] font-medium no-underline outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg1)] md:size-7 md:text-sm"
                href={`#${item.id}`}
              >
                {index + 1}
              </a>
            )}
            <span
              aria-hidden
              className={[
                '[background-color:var(--color-docs-code-surface)] absolute start-1/2 w-px -translate-x-1/2',
                preview
                  ? 'top-5 bottom-[-1rem] data-[last]:bottom-[-0.5rem] md:top-6 md:bottom-[-1rem] md:data-[last]:bottom-[-0.625rem]'
                  : 'top-6 bottom-[-2rem] data-[last]:bottom-[-1rem] md:top-7 md:bottom-[-2.25rem] md:data-[last]:bottom-[-1.125rem]',
              ]
                .filter(Boolean)
                .join(' ')}
              data-last={index === items.length - 1 ? '' : undefined}
            />
          </div>

          <div className="min-w-0">
            {renderDocHeading(
              'h3',
              { children: item.title, id: item.id },
              {
                className: getDocHeadingClassName('h3', {
                  preview,
                  tight: true,
                  withMargin: false,
                }),
                linked: false,
                preview,
              },
            )}
            <div className={contentClassName}>{item.content}</div>
          </div>
        </li>
      ))}
    </ol>
  )
}

function Step(props: React.PropsWithChildren<{ title?: string }>) {
  const { children } = props
  return <>{children}</>
}

// Share one lightweight store per docs page so tab changes do not rerender the route tree.
type CodeGroupStore = {
  getSnapshot: () => string | undefined
  setValue: (value: string) => void
  subscribe: (listener: () => void) => () => void
  syncFromUrl: () => void
}

const codeGroupStoreContext = React.createContext<CodeGroupStore | undefined>(undefined)

function CodeGroup(props: React.PropsWithChildren) {
  const { children } = props
  const codeGroupStore = React.useContext(codeGroupStoreContext)
  if (!codeGroupStore) throw new Error('CodeGroup must be rendered within DocContent')

  const items = React.useMemo(() => getCodeGroupItems(children), [children])
  const [value, setValue] = React.useState(items[0]?.value ?? '0')
  const sharedLabel = React.useSyncExternalStore(
    codeGroupStore.subscribe,
    codeGroupStore.getSnapshot,
    getCodeGroupStoreSnapshot,
  )

  React.useEffect(() => {
    if (sharedLabel) {
      const nextValue = items.find((item) => item.normalizedLabel === sharedLabel)?.value
      if (nextValue) {
        setValue((current) => (current === nextValue ? current : nextValue))
        return
      }
    }

    setValue((current) => {
      if (items.some((item) => item.value === current)) return current
      return items[0]?.value ?? '0'
    })
  }, [items, sharedLabel])

  if (!items[0]) return <>{children}</>

  return (
    <Tabs.Root
      onValueChange={(nextValue) => {
        const nextValueString = String(nextValue)
        const nextItem = items.find((item) => item.value === nextValueString)
        // Update the clicked tab first so focus stays on the interacted control.
        setValue(nextValueString)
        if (!nextItem) return
        codeGroupStore.setValue(nextItem.normalizedLabel)
      }}
      value={value}
    >
      <CodeGroupFrame>
        <CodeGroupTabStrip root={Tabs.List} rootProps={{ 'aria-label': 'Code group' }}>
          {items.map((item) => (
            <CodeGroupTab
              active={value === item.value}
              key={item.value}
              label={item.label}
              root={Tabs.Tab}
              rootProps={{ value: item.value }}
            />
          ))}
        </CodeGroupTabStrip>

        {items.map((item) => (
          <CodeGroupPanel key={item.value} root={Tabs.Panel} rootProps={{ value: item.value }}>
            {item.content}
          </CodeGroupPanel>
        ))}
      </CodeGroupFrame>
    </Tabs.Root>
  )
}

function PreviewCodeGroup(props: React.PropsWithChildren<{ terms?: Array<string> | undefined }>) {
  const items = React.useMemo(() => getCodeGroupItems(props.children), [props.children])
  const activeItemIndex = React.useMemo(
    () => getPreviewCodeGroupActiveItemIndex(items, props.terms),
    [items, props.terms],
  )
  if (!items[0]) return <>{props.children}</>

  return (
    <CodeGroupFrame preview>
      <CodeGroupTabStrip preview root="div">
        {items.map((item, index) => (
          <CodeGroupTab
            active={index === activeItemIndex}
            key={item.value}
            label={item.label}
            preview
            root="span"
          />
        ))}
      </CodeGroupTabStrip>

      <CodeGroupPanel preview root="div">
        {items[activeItemIndex]?.content ?? items[0].content}
      </CodeGroupPanel>
    </CodeGroupFrame>
  )
}

function CodeGroupFrame(props: React.PropsWithChildren<{ preview?: boolean }>) {
  const { children, preview = false } = props
  return (
    <div
      className={[
        preview ? 'mt-3' : 'mt-4',
        'overflow-hidden [background-color:var(--color-docs-code-surface)]',
      ]
        .filter(Boolean)
        .join(' ')}
      data-docs-code-group=""
    >
      {children}
    </div>
  )
}

function CodeGroupPanel(props: {
  children: React.ReactNode
  preview?: boolean
  root: React.ElementType
  rootProps?: Record<string, unknown>
}) {
  const { children, preview = false, root: Root, rootProps } = props

  return (
    <Root {...rootProps} className={getCodeGroupPanelClassName(preview)}>
      {children}
    </Root>
  )
}

function CodeGroupTab(props: {
  active: boolean
  label: string
  preview?: boolean
  root: React.ElementType
  rootProps?: Record<string, unknown>
}) {
  const { active, label, preview = false, root: Root, rootProps } = props

  return (
    <Root
      {...rootProps}
      className={getCodeGroupTabClassName(preview)}
      data-active={active ? '' : undefined}
    >
      <CodeGroupTabLabel active={active} label={label} />
    </Root>
  )
}

function CodeGroupTabStrip(props: {
  children: React.ReactNode
  preview?: boolean
  root: React.ElementType
  rootProps?: Record<string, unknown>
}) {
  const { children, preview = false, root: Root, rootProps } = props

  return (
    <Root {...rootProps} className={getCodeGroupTabStripClassName(preview)}>
      <CodeGroupTabStripUnderline />
      {children}
    </Root>
  )
}

function CodeGroupTabStripUnderline() {
  return (
    <span aria-hidden className="bg-gray-a3 pointer-events-none absolute inset-x-0 bottom-0 h-px" />
  )
}

function CodeGroupTabLabel(props: { active: boolean; label: string }) {
  const { active, label } = props

  return (
    <>
      <span
        aria-hidden
        className="bg-gray10 pointer-events-none absolute right-[8px] bottom-0 left-[8px] z-20 h-px opacity-0 data-[active]:opacity-100"
        data-active={active ? '' : undefined}
      />
      <span className="flex items-center gap-2">
        <CodeGroupTabIcon label={label} />
        <span>{label}</span>
      </span>
    </>
  )
}

function getCodeGroupPanelClassName(preview = false) {
  return preview
    ? '[&_[data-docs-code-block]]:mt-0 [&_[data-docs-code-block]_pre]:px-4 [&_pre]:border-0'
    : 'focus-visible:ring-blue8 focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-inset [&_[data-docs-code-block]]:mt-0 [&_[data-docs-code-block]_pre]:ps-5 [&_[data-docs-code-block]_pre]:pe-12 [&_pre]:border-0'
}

function getCodeGroupTabClassName(preview = false) {
  return [
    'text-gray9 data-[active]:text-gray10 relative z-10 font-medium whitespace-nowrap',
    preview
      ? 'px-2.5 py-2 text-[0.6875rem]'
      : 'hover:text-gray10 focus-visible:ring-blue8 px-3 py-3 text-sm focus:outline-none focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-inset',
  ]
    .filter(Boolean)
    .join(' ')
}

function getCodeGroupTabStripClassName(preview = false) {
  return [
    'relative flex gap-1 overflow-y-hidden px-2 [background-color:var(--color-docs-code-surface)] scrollbar-thin scrollbar-thumb-gray-a3 scrollbar-track-transparent',
    preview ? 'overflow-x-hidden' : 'overflow-x-auto',
  ]
    .filter(Boolean)
    .join(' ')
}

function CodeGroupItem(props: React.PropsWithChildren<{ label?: string }>) {
  const { children } = props
  return <>{children}</>
}

function CodeGroupTabIcon(props: { label: string; language?: string | undefined }) {
  const icon = getCodeGroupTabIcon(props.label, props.language)
  if (!icon) return null

  if (icon === codeGroupTabIcons.curl) return <CodeGroupCurlIcon />
  if (icon === codeGroupTabIcons.pnpm) return <CodeGroupPnpmIcon />

  return (
    <icon.Component
      aria-hidden
      className={['size-4 shrink-0', 'className' in icon ? icon.className : undefined]
        .filter(Boolean)
        .join(' ')}
    />
  )
}

function DocsCodeBlock(props: React.ComponentProps<'pre'> & { preview?: boolean }) {
  const { children, className, preview = false, style, title, ...rest } = props
  const backgroundColor =
    typeof style?.backgroundColor === 'string'
      ? style.backgroundColor
      : 'var(--color-docs-code-surface)'
  const language = React.useMemo(() => getCodeElementLanguage(getCodeElement(children)), [children])
  const promptShellBlock = hasPromptShellBlock(children, props)
  const promptShellLines = React.useMemo(
    () => getPromptShellLines(children, promptShellBlock),
    [children, promptShellBlock],
  )
  const promptShellCommandLines = React.useMemo(
    () => (promptShellLines ?? []).filter((line) => line.text.trim() !== ''),
    [promptShellLines],
  )
  const shouldShowPromptCopyButtons = !preview && promptShellCommandLines.length > 0
  const [activePromptLineIndex, setActivePromptLineIndex] = React.useState<number | undefined>(
    undefined,
  )
  const copyText = React.useMemo(
    () =>
      promptShellCommandLines.length
        ? getPromptShellText(promptShellCommandLines)
        : getCodeBlockText(children),
    [children, promptShellCommandLines],
  )
  const activatePromptLine = React.useCallback((childIndex: number) => {
    setActivePromptLineIndex((current) => (current === childIndex ? current : childIndex))
  }, [])
  const deactivatePromptLine = React.useCallback(() => {
    setActivePromptLineIndex(undefined)
  }, [])
  const label = typeof title === 'string' && title.trim() ? title.trim() : undefined
  const renderedChildren = React.useMemo(
    () =>
      promptShellLines && !preview
        ? replaceCodeElement(children, (codeElement) =>
            renderPromptCopyCodeElement(
              codeElement,
              promptShellBlock,
              promptShellLines,
              shouldShowPromptCopyButtons,
              shouldShowPromptCopyButtons
                ? {
                    activatePromptLine,
                    deactivatePromptLine,
                  }
                : undefined,
            ),
          )
        : children,
    [
      activatePromptLine,
      children,
      deactivatePromptLine,
      preview,
      promptShellBlock,
      promptShellLines,
      shouldShowPromptCopyButtons,
    ],
  )
  const shouldShowCopyButton = Boolean(copyText && !preview && !shouldShowPromptCopyButtons)
  const { copied, copy } = useCopyToClipboard(copyText ? { content: copyText } : {})

  return (
    <div
      className={['group/code relative overflow-hidden', preview ? 'mt-3' : 'mt-4']
        .filter(Boolean)
        .join(' ')}
      data-docs-code-block=""
      style={{ '--docs-code-block-background': backgroundColor } as React.CSSProperties}
    >
      {label && (
        <div
          className="border-gray-a3 border-b [background-color:var(--docs-code-block-background)]"
          data-docs-code-title=""
        >
          <span
            className={[
              'text-gray10 flex min-w-0 items-center gap-2 font-medium whitespace-nowrap',
              preview ? 'px-3 py-2 pe-12 text-[0.8125rem]' : 'px-4 py-3 pe-14 text-sm',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            <CodeGroupTabIcon label={label} language={language} />
            <span className="truncate">{label}</span>
          </span>
        </div>
      )}

      {shouldShowCopyButton && (
        <CodeBlockCopyButton
          copied={copied}
          floating
          headerAligned={Boolean(label)}
          hoverOnly={!label}
          onClick={() => copy()}
        />
      )}
      <div className="relative">
        {shouldShowPromptCopyButtons && promptShellLines ? (
          <PromptCopyButtonsOverlay
            activeLineIndex={activePromptLineIndex}
            lines={promptShellLines}
            onActivate={activatePromptLine}
            onDeactivate={deactivatePromptLine}
          />
        ) : null}

        <pre
          {...rest}
          className={[
            '[background-color:var(--docs-code-block-background)] focus-visible:ring-blue8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset mt-0 scrollbar-thin scrollbar-thumb-gray-a3 scrollbar-track-transparent',
            preview ? 'overflow-x-hidden' : 'overflow-x-auto',
            preview ? 'p-3 leading-[1.45]' : 'p-4 leading-relaxed',
            shouldShowCopyButton && !label ? 'ps-4 pe-12' : undefined,
            shouldShowPromptCopyButtons ? 'pe-16' : undefined,
            label ? (preview ? 'border-t-0 pt-2.5' : 'border-t-0 pt-3') : undefined,
            '[&_code]:bg-transparent [&_code]:p-0 [&_code]:!text-[1em]',
            className,
          ]
            .filter(Boolean)
            .join(' ')}
          style={{ ...style, backgroundColor }}
        >
          {renderedChildren}
        </pre>
      </div>
    </div>
  )
}

function PromptCopyButtonsOverlay(props: {
  activeLineIndex: number | undefined
  lines: Array<{ childIndex: number; promptLength: number; text: string }>
  onActivate: (childIndex: number) => void
  onDeactivate: () => void
}) {
  const { activeLineIndex, lines, onActivate, onDeactivate } = props

  return (
    <div
      className="pointer-events-none absolute inset-y-0 end-0 z-10 flex flex-col pe-3 pt-4 pb-4 leading-relaxed"
      data-prompt-copy-overlay=""
    >
      {lines.map((line) => (
        <div className="flex h-[1lh] items-center justify-end" key={line.childIndex}>
          {line.text.trim() ? (
            <PromptCopyButton
              active={activeLineIndex === line.childIndex}
              onActivate={() => onActivate(line.childIndex)}
              onDeactivate={onDeactivate}
              text={line.text}
            />
          ) : null}
        </div>
      ))}
    </div>
  )
}

function CodeBlockCopyButton(props: {
  copied: boolean
  floating?: boolean
  headerAligned?: boolean
  hoverOnly?: boolean
  onClick: () => void
}) {
  const { copied, floating, headerAligned, hoverOnly, onClick } = props

  return (
    <button
      aria-label={copied ? 'Code copied' : 'Copy code'}
      className={[
        'text-gray8 hover:text-gray10 focus-visible:text-gray10 focus-visible:ring-blue8 z-10 p-1.5 [background-color:var(--docs-code-block-background)] focus:outline-none focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-inset data-[copied]:opacity-100',
        floating
          ? headerAligned
            ? 'absolute end-3 top-[1.375rem] -translate-y-1/2'
            : 'absolute end-3 top-3'
          : 'me-3 shrink-0',
        hoverOnly
          ? 'opacity-0 transition-opacity group-focus-within/code:opacity-100 group-hover/code:opacity-100 focus:opacity-100'
          : undefined,
      ]
        .filter(Boolean)
        .join(' ')}
      data-copied={copied ? '' : undefined}
      onClick={onClick}
      type="button"
    >
      {copied ? (
        <IconOcticonCheck16 className="text-teal9 size-4" />
      ) : (
        <IconOcticonCopy16 className="size-4" />
      )}
    </button>
  )
}

function CodeGroupPnpmIcon() {
  return (
    <>
      <IconVscodeIconsFileTypeLightPnpm aria-hidden className="size-4 shrink-0 dark:hidden" />
      <IconVscodeIconsFileTypePnpm aria-hidden className="hidden size-4 shrink-0 dark:block" />
    </>
  )
}

function CodeGroupCurlIcon() {
  return (
    <>
      <IconBrandCurl aria-hidden className="size-4 shrink-0 dark:hidden" />
      <IconBrandCurlLight aria-hidden className="hidden size-4 shrink-0 dark:block" />
    </>
  )
}

function NoticeIcon(props: { type: string }) {
  const { type } = props

  switch (type) {
    case 'caution':
      return <IconOcticonStop16 aria-hidden className="size-3 shrink-0" />
    case 'hint':
      return <IconOcticonInfo16 aria-hidden className="size-3 shrink-0" />
    case 'important':
      return <IconOcticonReport16 aria-hidden className="size-3 shrink-0" />
    case 'tip':
      return <IconOcticonLightBulb16 aria-hidden className="size-3 shrink-0" />
    case 'warning':
      return <IconOcticonAlert16 aria-hidden className="size-3 shrink-0" />
    default:
      return <IconOcticonInfo16 aria-hidden className="size-3 shrink-0" />
  }
}

function DocPaginationLink(props: {
  direction: 'next' | 'previous'
  doc: { path: string; title: string }
}) {
  const { direction, doc } = props

  return (
    <Link
      className="border-gray-a3 hover:bg-gray-a1/50 flex flex-col gap-1 border px-5 py-4 text-left data-[direction=next]:items-end data-[direction=next]:text-right"
      data-direction={direction}
      to={getDocHref(doc.path)}
    >
      <span className="text-gray8 text-sm">
        {direction === 'previous' ? 'Previous page' : 'Next page'}
      </span>
      <span className="text-gray10 text-sm font-medium md:text-base">{doc.title}</span>
    </Link>
  )
}

function getAbsoluteTop(element: HTMLElement) {
  let offsetTop = 0
  let current: HTMLElement | null = element

  while (current !== document.body) {
    if (current === null) return Number.NaN
    offsetTop += current.offsetTop
    current = current.offsetParent as HTMLElement | null
  }

  return offsetTop
}

function isHeadingVisibleInViewport(
  element: HTMLElement,
  fixedNavbarHeightPx: number,
  thresholdOffsetPx: number,
) {
  const rect = element.getBoundingClientRect()
  const viewportTop = fixedNavbarHeightPx + thresholdOffsetPx

  return rect.bottom > viewportTop && rect.top < window.innerHeight
}

function getDocHref(path: string) {
  return path ? `/docs/${path}` : '/docs'
}

function formatLastUpdated(value: string, options?: { locale?: string; timeZone?: string }) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  const yearFormatter = new Intl.DateTimeFormat(options?.locale, {
    ...(options?.timeZone ? { timeZone: options.timeZone } : {}),
    year: 'numeric',
  })
  const showYear =
    getDateTimePart(yearFormatter, date, 'year') !==
    getDateTimePart(yearFormatter, new Date(), 'year')

  return new Intl.DateTimeFormat(options?.locale, {
    day: 'numeric',
    hour: 'numeric',
    hour12: true,
    minute: '2-digit',
    month: 'short',
    ...(options?.timeZone ? { timeZone: options.timeZone } : {}),
    ...(showYear ? { year: 'numeric' } : {}),
  })
    .formatToParts(date)
    .map((part) =>
      part.type === 'literal' ? normalizeLastUpdatedLiteral(part.value, showYear) : part.value,
    )
    .join('')
    .trim()
}

function normalizeLastUpdatedLiteral(value: string, showYear: boolean) {
  const normalized = value.replace(' at ', ' ').replace(/\u202f/g, ' ')
  return showYear ? normalized : normalized.replace(/,\s*/g, ' ')
}

function getDateTimePart(
  formatter: Intl.DateTimeFormat,
  date: Date,
  type: Intl.DateTimeFormatPartTypes,
) {
  return formatter.formatToParts(date).find((part) => part.type === type)?.value
}

function getNodeText(node: React.ReactNode): string | undefined {
  const text = nodeToString(node)
  return text || undefined
}

function getCodeBlockText(node: React.ReactNode): string | undefined {
  const codeElement = getCodeElement(node)
  if (!codeElement) return getNodeText(node)

  const lines = getCodeElementTextLines(codeElement)
  const text = lines.join('\n').replace(/\n+$/, '')
  return text || undefined
}

function nodeToString(node: React.ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (node === null || node === undefined || typeof node === 'boolean') return ''
  if (Array.isArray(node)) return node.map((child) => nodeToString(child)).join('')
  if (React.isValidElement(node)) {
    const element = node as React.ReactElement<{ children?: React.ReactNode }>
    return nodeToString(element.props.children)
  }
  return ''
}

function getPromptShellLines(node: React.ReactNode, hasPromptShellBlock: boolean) {
  const codeElement = getCodeElement(node)
  if (!codeElement) return undefined

  const language = getCodeElementLanguage(codeElement)
  const shellCodeLanguages = new Set(['bash', 'shell', 'sh', 'zsh'])
  if (!language || !shellCodeLanguages.has(language)) return undefined

  const lines = getCodeElementLineElements(codeElement)
  if (hasPromptShellBlock)
    return lines.map((line) => ({ childIndex: line.childIndex, promptLength: 0, text: line.text }))

  const nonEmptyLines = lines.filter((line) => line.text.trim() !== '')
  if (!nonEmptyLines.length || nonEmptyLines.some((line) => !getShellPromptPrefix(line.text)))
    return undefined

  return lines.map((line) => ({
    childIndex: line.childIndex,
    promptLength: getShellPromptPrefix(line.text)?.length ?? 0,
    text: stripPromptShellLine(line.text),
  }))
}

function hasPromptShellBlock(node: React.ReactNode, props: React.ComponentProps<'pre'>) {
  if ('data-shell-prompt' in props && props['data-shell-prompt'] !== undefined) return true

  const codeElement = getCodeElement(node)
  return 'data-shell-prompt' in (codeElement?.props ?? {})
}

function getCodeElement(node: React.ReactNode): CodeElement | undefined {
  if (Array.isArray(node)) {
    for (const child of node) {
      const codeElement = getCodeElement(child)
      if (codeElement) return codeElement
    }

    return undefined
  }

  if (!React.isValidElement(node)) return undefined
  const element = node as React.ReactElement<{ children?: React.ReactNode; className?: string }>
  if (element.type === 'code' || element.type === DocsInlineCode) return element

  return getCodeElement(element.props.children)
}

function getCodeElementLanguage(codeElement: CodeElement | undefined): string | undefined {
  const className =
    typeof codeElement?.props.className === 'string' ? codeElement.props.className : ''
  return /\blanguage-([\w-]+)/.exec(className)?.[1]
}

function getCodeElementLineElements(codeElement: CodeElement) {
  return React.Children.toArray(codeElement.props.children)
    .map((child, childIndex) => {
      if (!isCodeLineElement(child)) return undefined

      return {
        childIndex,
        text: nodeToString(child.props.children),
      }
    })
    .filter((line): line is { childIndex: number; text: string } => line !== undefined)
}

function getCodeElementTextLines(codeElement: CodeElement) {
  const lines = getCodeElementLineElements(codeElement)
  if (lines.length) return lines.map((line) => line.text)

  const text = nodeToString(codeElement.props.children)
  return text ? text.split('\n') : []
}

function isCodeLineElement(node: React.ReactNode): node is CodeLineElement {
  if (!React.isValidElement(node)) return false

  const element = node as React.ReactElement<{ children?: React.ReactNode; className?: string }>
  return typeof element.props.className === 'string' && /\bline\b/.test(element.props.className)
}

function replaceCodeElement(
  node: React.ReactNode,
  replace: (codeElement: CodeElement) => React.ReactNode,
): React.ReactNode {
  if (Array.isArray(node)) return node.map((child) => replaceCodeElement(child, replace))
  if (!React.isValidElement(node)) return node

  const element = node as React.ReactElement<{ children?: React.ReactNode; className?: string }>
  if (element.type === 'code' || element.type === DocsInlineCode) return replace(element)
  if (element.props.children === undefined) return node

  return React.cloneElement(element, undefined, replaceCodeElement(element.props.children, replace))
}

function renderPromptCopyCodeElement(
  codeElement: CodeElement,
  promptShellBlock: boolean,
  promptShellLines: Array<{ childIndex: number; promptLength: number; text: string }>,
  reserveTrailingCopySpace: boolean,
  hoverHandlers:
    | {
        activatePromptLine: (childIndex: number) => void
        deactivatePromptLine: () => void
      }
    | undefined,
) {
  const codeChildren = React.Children.toArray(codeElement.props.children)
  const promptLineMap = new Map(promptShellLines.map((line) => [line.childIndex, line]))

  return React.cloneElement(
    codeElement,
    undefined,
    codeChildren.flatMap((child, childIndex) => {
      if (typeof child === 'string' && child.trim() === '') return []
      if (!isCodeLineElement(child)) return [child]

      const promptLine = promptLineMap.get(childIndex)
      if (!promptLine) return [child]

      return React.cloneElement(
        child,
        {
          className: [
            child.props.className,
            'flex items-center gap-3',
            reserveTrailingCopySpace ? 'min-w-full w-max' : 'w-full',
          ]
            .filter(Boolean)
            .join(' '),
          ...(hoverHandlers
            ? {
                onMouseEnter: () => hoverHandlers.activatePromptLine(childIndex),
                onMouseLeave: () => hoverHandlers.deactivatePromptLine(),
              }
            : {}),
        },
        <>
          {/* Render a single visual prompt even when authored prefixes differ. */}
          <span
            aria-hidden
            className="[&[data-command-prompt]]:!text-gray10 shrink-0 select-none"
            data-command-prompt=""
          >
            $
          </span>
          <span className={reserveTrailingCopySpace ? 'flex-none' : 'min-w-0 flex-1'}>
            {promptShellBlock
              ? child.props.children
              : stripLeadingCharacters(child.props.children, promptLine.promptLength).node}
          </span>
          {reserveTrailingCopySpace ? (
            <span aria-hidden className="w-14 shrink-0" data-command-copy-spacer="" />
          ) : null}
        </>,
      )
    }),
  )
}

function getShellPromptPrefix(line: string) {
  return shellPromptPrefixes.find((prefix) => line.startsWith(prefix))
}

function stripPromptShellLine(line: string) {
  const prefix = getShellPromptPrefix(line)
  return prefix ? line.slice(prefix.length) : line
}

function getPromptShellText(lines: Array<{ text: string }>) {
  const text = lines
    .map((line) => line.text)
    .join('\n')
    .replace(/\n+$/, '')
  return text || undefined
}

function PromptCopyButton(props: {
  active: boolean
  onActivate: () => void
  onDeactivate: () => void
  text: string
}) {
  const { active, onActivate, onDeactivate, text } = props
  const { copied, copy } = useCopyToClipboard({ content: text })

  return (
    <button
      aria-label={`Copy command: ${text}`}
      className="text-gray8 hover:text-gray10 focus-visible:text-gray10 focus-visible:ring-blue8 pointer-events-auto shrink-0 [background-color:var(--docs-code-block-background)] p-1.5 opacity-0 transition-opacity focus:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-inset data-[active]:opacity-100 data-[copied]:opacity-100"
      data-active={active ? '' : undefined}
      data-copied={copied ? '' : undefined}
      data-copy-command=""
      onBlur={onDeactivate}
      onClick={() => copy()}
      onFocus={onActivate}
      onMouseEnter={onActivate}
      onMouseLeave={onDeactivate}
      type="button"
    >
      {copied ? (
        <IconOcticonCheck16 className="text-teal9 size-4" />
      ) : (
        <IconOcticonCopy16 className="size-4" />
      )}
    </button>
  )
}

function stripLeadingCharacters(
  node: React.ReactNode,
  count: number,
): {
  node: React.ReactNode
  remaining: number
} {
  if (count <= 0) return { node, remaining: 0 }

  if (typeof node === 'string') {
    if (node.length <= count) return { node: '', remaining: count - node.length }
    return { node: node.slice(count), remaining: 0 }
  }

  if (typeof node === 'number') return stripLeadingCharacters(String(node), count)
  if (node === null || node === undefined || typeof node === 'boolean')
    return { node, remaining: count }

  if (Array.isArray(node)) {
    const children: Array<React.ReactNode> = []
    let remaining = count

    for (const child of React.Children.toArray(node)) {
      const stripped = stripLeadingCharacters(child, remaining)
      remaining = stripped.remaining
      if (stripped.node === '') continue
      children.push(...React.Children.toArray(stripped.node))
    }

    return { node: children, remaining }
  }

  if (!React.isValidElement(node)) return { node, remaining: count }

  const element = node as React.ReactElement<{ children?: React.ReactNode }>
  const strippedChildren = stripLeadingCharacters(element.props.children, count)
  return {
    node: React.cloneElement(element, undefined, strippedChildren.node),
    remaining: strippedChildren.remaining,
  }
}

function getCodeGroupLanguage(node: React.ReactNode): string | undefined {
  if (Array.isArray(node)) {
    for (const child of node) {
      const language = getCodeGroupLanguage(child)
      if (language) return language
    }

    return undefined
  }

  return getCodeElementLanguage(getCodeElement(node))
}

function getCodeGroupItems(children: React.ReactNode) {
  return React.Children.toArray(children)
    .filter(
      (child): child is React.ReactElement<React.PropsWithChildren<{ label?: string }>> =>
        React.isValidElement(child) && child.type === CodeGroupItem,
    )
    .map((child, index) => {
      const label =
        child.props.label?.trim() ||
        getCodeGroupLanguage(child.props.children) ||
        `Code ${index + 1}`

      return {
        content: child.props.children,
        label,
        normalizedLabel: label.trim().toLowerCase(),
        value: String(index),
      }
    })
}

function getPreviewCodeGroupActiveItemIndex(
  items: ReturnType<typeof getCodeGroupItems>,
  terms: Array<string> | undefined,
) {
  const normalizedTerms = normalizeDocSearchHighlightTerms(terms).map((term) => term.toLowerCase())
  if (!normalizedTerms.length) return 0

  let bestIndex = 0
  let bestScore = 0

  items.forEach((item, index) => {
    const label = item.label.toLowerCase()
    const content = (
      getCodeBlockText(item.content) ??
      getNodeText(item.content) ??
      ''
    ).toLowerCase()
    const score = normalizedTerms.reduce((total, term) => {
      if (label === term) return total + 6
      if (label.includes(term)) return total + 4
      if (content.includes(term)) return total + 2
      return total
    }, 0)

    if (score > bestScore) {
      bestIndex = index
      bestScore = score
    }
  })

  return bestIndex
}

function getStepItems(children: React.ReactNode) {
  const stepSlugCounts = new Map<string, number>()

  return React.Children.toArray(children)
    .filter(
      (child): child is React.ReactElement<React.PropsWithChildren<{ title?: string }>> =>
        React.isValidElement(child) && child.type === Step,
    )
    .map((child, index) => ({
      content: child.props.children,
      id: getStepId(child.props.title?.trim() || `Step ${index + 1}`, stepSlugCounts),
      title: child.props.title?.trim() || `Step ${index + 1}`,
    }))
}

function splitNumberedHeading(text: string) {
  const match = /^(\d+\.)(?:\s+)(.+)$/u.exec(text.trim())
  if (!match) return

  return {
    number: match[1],
    title: match[2],
  }
}

const hashHeadingGracePeriodMs = 250 // 0.25 seconds
const docSearchPreviewOffsetTopPx = 20 // 20 pixels
const codeGroupLegacyQueryParam = 'codegroup'
const codeGroupQueryParam = 'tab'
const shellPromptPrefixes = ['$ ', '> ', '\u276f ']

export function getDocSearchPreviewAnchor(container: HTMLElement, hash: string | undefined) {
  if (hash) {
    const target = container.querySelector<HTMLElement>(
      `[data-doc-search-anchor="${CSS.escape(hash)}"]`,
    )
    const targetHasHighlight = target ? doesDocSearchPreviewElementContainHighlight(target) : false
    if (target)
      return (
        getDocSearchPreviewHighlightAnchor(container, target) ??
        target.closest<HTMLElement>('[data-docs-step]') ??
        (!targetHasHighlight
          ? getDocSearchPreviewFollowingContentAnchor(container, target)
          : undefined) ??
        target
      )
  }

  const firstHighlight = container.querySelector<HTMLElement>('mark[data-doc-search-highlight]')
  if (firstHighlight) return getDocSearchPreviewBlock(firstHighlight)

  if (!hash)
    return container.querySelector<HTMLElement>(
      'h1, h2, h3, h4, p, ol, pre, table, ul, [role="note"], [data-docs-card], [data-docs-code-block], [data-docs-step]',
    )

  return (
    container.querySelector<HTMLElement>('[data-docs-card]') ??
    container.querySelector<HTMLElement>('[data-docs-step]') ??
    container.querySelector<HTMLElement>('[data-docs-code-block]') ??
    container.querySelector<HTMLElement>('[role="note"]') ??
    container.querySelector<HTMLElement>('h1, h2, h3, h4, p, ol, pre, table, ul')
  )
}

function getDocSearchPreviewHighlightAnchor(container: HTMLElement, target: HTMLElement) {
  const boundary = getDocSearchPreviewSectionBoundary(container, target)
  const highlights = container.querySelectorAll<HTMLElement>('mark[data-doc-search-highlight]')
  const targetIsHeading = getDocSearchPreviewHeadingLevel(target) !== undefined
  const targetHasHighlight = doesDocSearchPreviewElementContainHighlight(target)

  if (targetIsHeading && targetHasHighlight) return target

  for (const highlight of highlights) {
    if (!(target.compareDocumentPosition(highlight) & Node.DOCUMENT_POSITION_FOLLOWING)) continue
    if (
      boundary &&
      (highlight === boundary ||
        Boolean(boundary.compareDocumentPosition(highlight) & Node.DOCUMENT_POSITION_FOLLOWING))
    )
      break

    const block = getDocSearchPreviewBlock(highlight)
    if (targetIsHeading && block === target) continue
    return block
  }

  return undefined
}

function doesDocSearchPreviewElementContainHighlight(element: HTMLElement) {
  return Boolean(
    element.matches('mark[data-doc-search-highlight]') ||
    element.querySelector('mark[data-doc-search-highlight]'),
  )
}

function getDocSearchPreviewFollowingContentAnchor(container: HTMLElement, target: HTMLElement) {
  const boundary = getDocSearchPreviewSectionBoundary(container, target)
  const contentBlocks = container.querySelectorAll<HTMLElement>(
    'p, ol, pre, table, ul, [role="note"], [data-docs-card], [data-docs-code-block], [data-docs-step]',
  )

  for (const contentBlock of contentBlocks) {
    if (!(target.compareDocumentPosition(contentBlock) & Node.DOCUMENT_POSITION_FOLLOWING)) continue
    if (
      boundary &&
      Boolean(boundary.compareDocumentPosition(contentBlock) & Node.DOCUMENT_POSITION_FOLLOWING)
    )
      break

    return getDocSearchPreviewBlock(contentBlock)
  }

  return undefined
}

function getDocSearchPreviewSectionBoundary(container: HTMLElement, target: HTMLElement) {
  const targetLevel = getDocSearchPreviewHeadingLevel(target)
  const anchors = container.querySelectorAll<HTMLElement>('[data-doc-search-anchor]')

  for (const anchor of anchors) {
    if (anchor === target) continue
    if (!(target.compareDocumentPosition(anchor) & Node.DOCUMENT_POSITION_FOLLOWING)) continue

    const anchorLevel = getDocSearchPreviewHeadingLevel(anchor)
    if (targetLevel === undefined || anchorLevel === undefined || anchorLevel <= targetLevel)
      return anchor
  }

  return undefined
}

function getDocSearchPreviewHeadingLevel(element: HTMLElement) {
  const match = /^H([1-6])$/u.exec(element.tagName)
  return match?.[1] ? Number.parseInt(match[1], 10) : undefined
}

function getDocSearchPreviewBlock(element: HTMLElement) {
  return (
    element.closest<HTMLElement>(
      '[data-docs-card], [data-docs-step], [role="note"], [data-docs-code-block]',
    ) ??
    element.closest<HTMLElement>('table, pre, ol, ul, p, h1, h2, h3, h4') ??
    element
  )
}

function highlightDocSearchPreview(container: HTMLElement, terms: Array<string> | undefined) {
  const textNodes: Array<Text> = []
  const textWalker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (!(node instanceof Text)) return NodeFilter.FILTER_REJECT
      if (!node.textContent?.trim()) return NodeFilter.FILTER_REJECT
      if (node.parentElement?.closest('script, style')) return NodeFilter.FILTER_REJECT
      return NodeFilter.FILTER_ACCEPT
    },
  })

  for (let currentNode = textWalker.nextNode(); currentNode; currentNode = textWalker.nextNode()) {
    if (currentNode instanceof Text) textNodes.push(currentNode)
  }

  for (const textNode of textNodes) {
    const ranges = getDocSearchHighlightRanges(textNode.data, terms)
    if (!ranges.length) continue

    const fragment = document.createDocumentFragment()
    let lastIndex = 0

    for (const range of ranges) {
      if (range.start > lastIndex) fragment.append(textNode.data.slice(lastIndex, range.start))

      const highlight = document.createElement('mark')
      highlight.className = docSearchHighlightClassName
      highlight.dataset.docSearchHighlight = ''
      highlight.textContent = textNode.data.slice(range.start, range.end)
      fragment.append(highlight)
      lastIndex = range.end
    }

    if (lastIndex < textNode.data.length) fragment.append(textNode.data.slice(lastIndex))
    textNode.parentNode?.replaceChild(fragment, textNode)
  }
}

function clearDocSearchPreviewHighlights(container: HTMLElement) {
  const highlights = container.querySelectorAll('mark[data-doc-search-highlight]')
  if (!highlights.length) return

  for (const highlight of highlights) {
    highlight.replaceWith(document.createTextNode(highlight.textContent ?? ''))
  }

  container.normalize()
}

function getCodeGroupTabIcon(label: string, language?: string) {
  const normalized = label.trim().toLowerCase()
  if (language === 'json' && normalized.endsWith('/.claude/settings.json')) return claudeCodeIcon
  if (language === 'json' && normalized.endsWith('/.pi/agent/settings.json')) return piCodeIcon

  if (
    (language === 'json' || language === 'jsonc') &&
    (normalized.endsWith('opencode.json') || normalized.endsWith('opencode.jsonc'))
  )
    return opencodeCodeIcon

  if (normalized in codeGroupTabIcons)
    return codeGroupTabIcons[normalized as keyof typeof codeGroupTabIcons]

  const extension = /\.([a-z0-9]+)$/.exec(normalized)?.[1]
  if (extension && extension in codeGroupExtensionIcons)
    return codeGroupExtensionIcons[extension as keyof typeof codeGroupExtensionIcons]

  return undefined
}

const claudeCodeIcon = { className: 'scale-95', Component: IconSimpleIconsClaude } as const
const opencodeCodeIcon = { className: 'scale-90', Component: IconBrandOpencode } as const
const piCodeIcon = { className: 'scale-125', Component: IconBrandPi } as const

function getDocsCardIcon(icon: string | undefined) {
  if (!icon) return undefined

  const normalized = icon.trim().toLowerCase()
  if (!normalized) return undefined
  if (normalized in docsCardIcons) return docsCardIcons[normalized as keyof typeof docsCardIcons]

  return undefined
}

function getDocsButtonLinkIcon(icon: 'github' | 'npm' | undefined) {
  if (!icon) return undefined
  return docsButtonLinkIcons[icon]
}

function getNpmPackageHref(name: string) {
  return `https://www.npmjs.com/package/${name}`
}

const codeGroupTabIcons = {
  bash: { Component: IconVscodeIconsFileTypeShell },
  bun: { Component: IconVscodeIconsFileTypeBun },
  curl: { Component: IconBrandCurl },
  deno: { Component: IconVscodeIconsFileTypeDeno },
  javascript: { Component: IconVscodeIconsFileTypeJs },
  json: { Component: IconVscodeIconsFileTypeJson },
  markdown: { Component: IconVscodeIconsFileTypeMarkdown },
  npm: { Component: IconVscodeIconsFileTypeNpm },
  pnpm: { Component: IconVscodeIconsFileTypePnpm },
  powershell: { Component: IconVscodeIconsFileTypePowershell },
  shell: { Component: IconVscodeIconsFileTypeShell },
  sh: { Component: IconVscodeIconsFileTypeShell },
  ts: { Component: IconVscodeIconsFileTypeTypescript },
  typescript: { Component: IconVscodeIconsFileTypeTypescript },
  yaml: { Component: IconVscodeIconsFileTypeYaml },
  yarn: { Component: IconVscodeIconsFileTypeYarn },
} as const

const docsCardIcons = {
  amp: { className: 'scale-145', Component: IconBrandAmp },
  book: { Component: IconOcticonBook16 },
  browser: { Component: IconOcticonGlobe16 },
  claude: { Component: IconSimpleIconsClaude },
  codex: { Component: IconSimpleIconsOpenai },
  cursor: { Component: IconSimpleIconsCursor },
  download: { Component: IconOcticonDownload16 },
  key: { Component: IconOcticonKey16 },
  lightbulb: { Component: IconOcticonLightBulb16 },
  opencode: { Component: IconBrandOpencode },
  package: { Component: IconOcticonPackage16 },
  pi: { className: 'scale-145', Component: IconBrandPi },
  rocket: { Component: IconOcticonZap16 },
  settings: { Component: IconOcticonGear16 },
  tag: { Component: IconOcticonTag16 },
  terminal: { Component: IconOcticonTerminal16 },
  users: { Component: IconOcticonPeople16 },
  wallet: { Component: IconOcticonCreditCard16 },
} as const

const docsButtonLinkIcons = {
  github: { Component: IconOcticonMarkGithub16 },
  npm: { Component: IconSimpleIconsNpm },
} as const

const codeGroupExtensionIcons = {
  bash: codeGroupTabIcons.bash,
  cjs: codeGroupTabIcons.javascript,
  js: codeGroupTabIcons.javascript,
  json: codeGroupTabIcons.json,
  jsonc: codeGroupTabIcons.json,
  md: codeGroupTabIcons.markdown,
  mdx: codeGroupTabIcons.markdown,
  mjs: codeGroupTabIcons.javascript,
  ps1: codeGroupTabIcons.powershell,
  sh: codeGroupTabIcons.sh,
  ts: codeGroupTabIcons.typescript,
  tsx: codeGroupTabIcons.typescript,
  yaml: codeGroupTabIcons.yaml,
  yml: codeGroupTabIcons.yaml,
  zsh: codeGroupTabIcons.sh,
} as const

function createCodeGroupStore(
  onValueChange?: ((value: string) => void) | undefined,
): CodeGroupStore {
  // Defer reading the URL until mount so SSR and hydration start from the same tab state.
  let value: string | undefined = undefined
  const listeners = new Set<() => void>()

  return {
    getSnapshot: () => value,
    setValue(nextValue) {
      if (onValueChange) onValueChange(nextValue)
      else if (typeof window !== 'undefined') {
        const url = new URL(window.location.href)
        url.searchParams.set(codeGroupQueryParam, nextValue)
        url.searchParams.delete(codeGroupLegacyQueryParam)
        if (
          `${url.pathname}${url.search}${url.hash}` !==
          window.location.pathname + window.location.search + window.location.hash
        )
          window.history.replaceState(window.history.state, '', url)
      }

      if (value === nextValue) return
      value = nextValue
      listeners.forEach((listener) => listener())
    },
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    syncFromUrl() {
      const nextValue = getCodeGroupStoreSnapshot()
      if (value === nextValue) return
      value = nextValue
      listeners.forEach((listener) => listener())
    },
  }
}

function getCodeGroupStoreSnapshot() {
  if (typeof window === 'undefined') return

  const searchParams = new URLSearchParams(window.location.search)
  const queryValue =
    searchParams.get(codeGroupQueryParam) ?? searchParams.get(codeGroupLegacyQueryParam)
  return queryValue ? queryValue.trim().toLowerCase() : undefined
}

const noticeTitles: Record<string, string> = {
  caution: 'Danger',
  hint: 'Hint',
  important: 'Important',
  note: 'Note',
  tip: 'Tip',
  warning: 'Warning',
}

type CodeElement = React.ReactElement<{ children?: React.ReactNode; className?: string }>
type CodeLineElement = React.ReactElement<{ children?: React.ReactNode; className?: string }>
