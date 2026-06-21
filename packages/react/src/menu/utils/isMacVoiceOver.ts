import { platform } from '@base-ui/utils/platform';

export function isMacVoiceOver() {
  return platform.os.mac && platform.screenReader.voiceOver;
}
