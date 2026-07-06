'use client'

import { useEffect, useRef, useState } from 'react'
import { useEvent } from 'react-use-event-hook'

import { useTranslations } from 'next-intl'
import type { DialogTriggerProps } from '@base-ui-components/react/dialog'
import { RotateCcwIcon, SettingsIcon } from 'lucide-react'

import { Button } from '~/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogTitle,
  DialogTrigger,
} from '~/components/ui/dialog'
import {
  type AiConfigUrlErrorKey,
  extractDomain,
  validateAiConfigBaseUrl,
} from '~/lib/ai-config-url'
import { eventTracker } from '~/lib/analytics'
import type { AiRuntimeConfig, TestConnectionResponse } from '~/types/ai-config'

import { AiConfigForm } from './AiConfigForm'

const EMPTY_CONFIG: AiRuntimeConfig = {
  baseUrl: '',
  apiKey: '',
  model: '',
}

const TEST_CONNECTION_TIMEOUT_MS = 20_000

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function parseTestConnectionResponse(value: unknown): TestConnectionResponse | null {
  if (!isRecord(value)) {
    return null
  }

  const message = typeof value.message === 'string' ? value.message : undefined
  const latencyMs = typeof value.latencyMs === 'number' ? value.latencyMs : undefined
  const modelName = typeof value.modelName === 'string' ? value.modelName : undefined

  if (typeof value.ok === 'boolean') {
    return {
      ok: value.ok,
      latencyMs,
      message,
      modelName,
    }
  }

  if (message) {
    return { ok: false, message, latencyMs, modelName }
  }

  return null
}

async function readTestConnectionResponse(
  response: Response,
): Promise<TestConnectionResponse | null> {
  try {
    return parseTestConnectionResponse(await response.json())
  }
  catch {
    return null
  }
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError'
}

function noopSetOpen(): void {
  return undefined
}

export interface AiConfigDialogProps {
  /** 当前已保存的配置 */
  config: AiRuntimeConfig | null
  /** 触发器（可选，默认为按钮） */
  trigger?: DialogTriggerProps['render']
  /** 控制对话框开关状态（可选，用于受控模式） */
  open?: boolean
  /** 开关状态变化回调（可选，用于受控模式） */
  onOpenChange?: (open: boolean) => void
  /** 重置配置回调 */
  onReset: () => void
  /** 保存配置回调 */
  onSave: (config: AiRuntimeConfig) => void
}

/**
 * AI 配置对话框
 *
 * 设计原则：
 * 1. 草稿状态 (draftConfig) 仅在对话框打开时有效
 * 2. 对话框打开时，从 config prop 初始化草稿
 * 3. 用户编辑时更新草稿，不影响原 config
 * 4. 保存时将草稿提交给父组件
 * 5. 取消/关闭时丢弃草稿
 */
export function AiConfigDialog({
  config,
  onSave,
  onReset,
  trigger,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: AiConfigDialogProps) {
  const t = useTranslations('aiConfig')

  // 内部状态（非受控模式使用）
  const [internalOpen, setInternalOpen] = useState(false)
  // 草稿配置：始终有值，不为 null
  const [draftConfig, setDraftConfig] = useState<AiRuntimeConfig>(config ?? EMPTY_CONFIG)
  const [isTesting, setIsTesting] = useState(false)
  const [testResult, setTestResult] = useState<TestConnectionResponse | null>(null)

  // 用于追踪对话框是否刚刚打开
  const prevOpenRef = useRef(false)
  const testRequestIdRef = useRef(0)
  const testAbortControllerRef = useRef<AbortController | null>(null)

  // 判断是否为受控模式
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : internalOpen
  const setOpen = isControlled ? (controlledOnOpenChange ?? noopSetOpen) : setInternalOpen

  const getUrlValidationMessage = useEvent((errorKey: AiConfigUrlErrorKey) => {
    switch (errorKey) {
      case 'httpsUrlRequired':
        return t('httpsUrlRequired')

      case 'urlHostNotAllowed':
        return t('urlHostNotAllowed')

      case 'urlPrivateAddressNotAllowed':
        return t('urlPrivateAddressNotAllowed')

      case 'invalidUrlFormat':
        return t('invalidUrlFormat')

      default:
        return t('invalidUrlFormat')
    }
  })

  const cancelActiveTest = useEvent(() => {
    testRequestIdRef.current += 1
    testAbortControllerRef.current?.abort()
    testAbortControllerRef.current = null
    setIsTesting(false)
  })

  // 监听对话框打开事件，初始化草稿配置
  useEffect(() => {
    const wasOpen = prevOpenRef.current
    prevOpenRef.current = open

    // 仅在对话框从关闭变为打开时初始化
    if (open && !wasOpen) {
      setDraftConfig(config ?? EMPTY_CONFIG)
      setTestResult(null)
      eventTracker.ai.config.open(config ? 'custom' : 'builtin')
    }
  }, [open, config])

  useEffect(() => {
    return () => {
      testRequestIdRef.current += 1
      testAbortControllerRef.current?.abort()
      testAbortControllerRef.current = null
    }
  }, [])

  const handleOpenChange = useEvent((newOpen: boolean) => {
    if (!newOpen) {
      cancelActiveTest()
    }

    setOpen(newOpen)
  })

  const handleConfigChange = useEvent((newConfig: AiRuntimeConfig) => {
    cancelActiveTest()
    setDraftConfig(newConfig)
    setTestResult(null)
  })

  const handleTestAsync = useEvent(async (configToTest: AiRuntimeConfig) => {
    const requestId = testRequestIdRef.current + 1
    testRequestIdRef.current = requestId

    testAbortControllerRef.current?.abort()
    const abortController = new AbortController()
    testAbortControllerRef.current = abortController

    setIsTesting(true)
    setTestResult(null)

    const startTime = performance.now()
    const timeoutState = { didTimeout: false }
    const timeoutId = window.setTimeout(() => {
      timeoutState.didTimeout = true
      abortController.abort()
    }, TEST_CONNECTION_TIMEOUT_MS)

    const isCurrentRequest = () => testRequestIdRef.current === requestId

    try {
      const validation = validateAiConfigBaseUrl(configToTest.baseUrl)

      if (!validation.valid) {
        if (isCurrentRequest()) {
          setTestResult({ ok: false, message: getUrlValidationMessage(validation.errorKey) })
        }

        return
      }

      const provider = validation.domain

      eventTracker.ai.config.test.start(provider)

      const response = await fetch('/api/ai/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aiConfig: configToTest }),
        signal: abortController.signal,
      })

      const parsedResult = await readTestConnectionResponse(response)
      const latencyMs = performance.now() - startTime

      if (!isCurrentRequest()) {
        return
      }

      if (!parsedResult) {
        eventTracker.ai.config.test.error(provider, 'invalid_response', latencyMs)
        setTestResult({ ok: false, message: t('testInvalidResponse') })

        return
      }

      const result = response.ok
        ? parsedResult
        : {
            ...parsedResult,
            ok: false,
            message: parsedResult.message ?? t('testRequestFailed', { status: response.status }),
          }

      if (result.ok) {
        eventTracker.ai.config.test.success(provider, result.latencyMs ?? latencyMs)
      }
      else {
        eventTracker.ai.config.test.error(provider, result.message ?? 'unknown', latencyMs)
      }

      setTestResult(result)
    }
    catch (error) {
      if (!isCurrentRequest()) {
        return
      }

      const latencyMs = performance.now() - startTime
      const provider = extractDomain(configToTest.baseUrl) ?? configToTest.baseUrl

      if (isAbortError(error) && timeoutState.didTimeout) {
        eventTracker.ai.config.test.error(provider, 'timeout', latencyMs)
        setTestResult({ ok: false, message: t('testTimeout') })

        return
      }

      if (isAbortError(error)) {
        return
      }

      eventTracker.ai.config.test.error(provider, 'network_error', latencyMs)
      setTestResult({ ok: false, message: t('testNetworkError') })
    }
    finally {
      window.clearTimeout(timeoutId)

      if (isCurrentRequest()) {
        testAbortControllerRef.current = null
        setIsTesting(false)
      }
    }
  })

  const handleTest = useEvent((configToTest: AiRuntimeConfig) => {
    void handleTestAsync(configToTest)
  })

  const handleSave = useEvent(() => {
    const trimmedConfig: AiRuntimeConfig = {
      baseUrl: draftConfig.baseUrl.trim(),
      apiKey: draftConfig.apiKey.trim(),
      model: draftConfig.model.trim(),
    }

    if (trimmedConfig.baseUrl && trimmedConfig.apiKey && trimmedConfig.model) {
      const validation = validateAiConfigBaseUrl(trimmedConfig.baseUrl)

      if (!validation.valid) {
        setTestResult({ ok: false, message: getUrlValidationMessage(validation.errorKey) })

        return
      }

      const provider = validation.domain

      cancelActiveTest()
      eventTracker.ai.config.save(provider)
      onSave(trimmedConfig)
      setOpen(false)
    }
  })

  const handleReset = useEvent(() => {
    cancelActiveTest()
    eventTracker.ai.config.reset()
    onReset()
    setDraftConfig(EMPTY_CONFIG)
    setTestResult(null)
    setOpen(false)
  })

  const canSave = Boolean(
    draftConfig.baseUrl.trim()
    && draftConfig.apiKey.trim()
    && draftConfig.model.trim(),
  )

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {(!isControlled || trigger) && (
        <DialogTrigger
          render={trigger ?? (
            <Button size="icon" variant="ghost">
              <SettingsIcon />
            </Button>
          )}
        />
      )}

      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('dialogTitle')}</DialogTitle>
          <DialogDescription>
            {t('dialogDescription')}
          </DialogDescription>
        </DialogHeader>

        <DialogPanel>
          <AiConfigForm
            isTesting={isTesting}
            testResult={testResult}
            value={draftConfig}
            onChange={handleConfigChange}
            onTest={handleTest}
          />
        </DialogPanel>

        <DialogFooter>
          {config && (
            <Button
              className="mr-auto"
              variant="ghost"
              onClick={handleReset}
            >
              <RotateCcwIcon className="size-4" />
              {t('resetToDefault')}
            </Button>
          )}

          <Button variant="outline" onClick={() => { setOpen(false) }}>
            {t('cancel')}
          </Button>
          <Button disabled={!canSave} onClick={handleSave}>
            {t('save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
