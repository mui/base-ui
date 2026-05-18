import { expectType } from '#test-utils';
import {
  Avatar,
  type AvatarFallbackProps,
  type AvatarFallbackState,
  type AvatarImageProps,
  type AvatarImageState,
  type AvatarRootProps,
  type AvatarRootState,
  type ImageLoadingStatus,
} from '@base-ui/react/avatar';

const rootProps: Avatar.Root.Props = {};
expectType<AvatarRootProps, typeof rootProps>(rootProps);

const imageProps: Avatar.Image.Props = {
  crossOrigin: 'anonymous',
  referrerPolicy: 'no-referrer',
  sizes: '48px',
  srcSet: 'avatar.png 1x, avatar@2x.png 2x',
};
expectType<AvatarImageProps, typeof imageProps>(imageProps);

const fallbackProps: Avatar.Fallback.Props = {
  delay: 100,
};
expectType<AvatarFallbackProps, typeof fallbackProps>(fallbackProps);

function expectRootState(state: Avatar.Root.State) {
  expectType<AvatarRootState, typeof state>(state);
  expectType<ImageLoadingStatus, typeof state.imageLoadingStatus>(state.imageLoadingStatus);
}

function expectImageState(state: Avatar.Image.State) {
  expectType<AvatarImageState, typeof state>(state);
  expectType<ImageLoadingStatus, typeof state.imageLoadingStatus>(state.imageLoadingStatus);
}

function expectFallbackState(state: Avatar.Fallback.State) {
  expectType<AvatarFallbackState, typeof state>(state);
  expectType<ImageLoadingStatus, typeof state.imageLoadingStatus>(state.imageLoadingStatus);
}

function expectLoadingStatus(status: ImageLoadingStatus) {
  expectType<ImageLoadingStatus, typeof status>(status);
}

<Avatar.Root
  {...rootProps}
  render={(props, state) => {
    expectRootState(state);
    return <span {...props} />;
  }}
>
  <Avatar.Image
    {...imageProps}
    onLoadingStatusChange={(status) => {
      expectLoadingStatus(status);
    }}
    render={(props, state) => {
      expectImageState(state);
      return <img alt="" {...props} />;
    }}
  />
  <Avatar.Fallback
    {...fallbackProps}
    render={(props, state) => {
      expectFallbackState(state);
      return <span {...props} />;
    }}
  />
</Avatar.Root>;
