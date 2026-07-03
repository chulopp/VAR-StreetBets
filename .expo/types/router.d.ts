/* eslint-disable */
import * as Router from 'expo-router';

export * from 'expo-router';

declare module 'expo-router' {
  export namespace ExpoRouter {
    export interface __routes<T extends string | object = string> {
      hrefInputParams: { pathname: Router.RelativePathString, params?: Router.UnknownInputParams } | { pathname: Router.ExternalPathString, params?: Router.UnknownInputParams } | { pathname: `/`; params?: Router.UnknownInputParams; } | { pathname: `/_sitemap`; params?: Router.UnknownInputParams; } | { pathname: `/bandar/console`; params?: Router.UnknownInputParams; } | { pathname: `/bandar`; params?: Router.UnknownInputParams; } | { pathname: `/punter/console`; params?: Router.UnknownInputParams; } | { pathname: `/punter`; params?: Router.UnknownInputParams; };
      hrefOutputParams: { pathname: Router.RelativePathString, params?: Router.UnknownOutputParams } | { pathname: Router.ExternalPathString, params?: Router.UnknownOutputParams } | { pathname: `/`; params?: Router.UnknownOutputParams; } | { pathname: `/_sitemap`; params?: Router.UnknownOutputParams; } | { pathname: `/bandar/console`; params?: Router.UnknownOutputParams; } | { pathname: `/bandar`; params?: Router.UnknownOutputParams; } | { pathname: `/punter/console`; params?: Router.UnknownOutputParams; } | { pathname: `/punter`; params?: Router.UnknownOutputParams; };
      href: Router.RelativePathString | Router.ExternalPathString | `/${`?${string}` | `#${string}` | ''}` | `/_sitemap${`?${string}` | `#${string}` | ''}` | `/bandar/console${`?${string}` | `#${string}` | ''}` | `/bandar${`?${string}` | `#${string}` | ''}` | `/punter/console${`?${string}` | `#${string}` | ''}` | `/punter${`?${string}` | `#${string}` | ''}` | { pathname: Router.RelativePathString, params?: Router.UnknownInputParams } | { pathname: Router.ExternalPathString, params?: Router.UnknownInputParams } | { pathname: `/`; params?: Router.UnknownInputParams; } | { pathname: `/_sitemap`; params?: Router.UnknownInputParams; } | { pathname: `/bandar/console`; params?: Router.UnknownInputParams; } | { pathname: `/bandar`; params?: Router.UnknownInputParams; } | { pathname: `/punter/console`; params?: Router.UnknownInputParams; } | { pathname: `/punter`; params?: Router.UnknownInputParams; };
    }
  }
}
