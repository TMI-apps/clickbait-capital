| id  | topic            | status | choice | source | notes |
| --- | ---------------- | ------ | ------ | ------ | ----- |
| D1  | Apply mechanism  | closed | `applyUpdate` activates the waiting worker itself (SKIP_WAITING, wait for `activated`/`redundant`) and then reloads; with nothing waiting it reloads | spec-debug-runtime reproduction | recorded as app-update-flow D4 in the feature README; the plugin's `updateServiceWorker` reloads only on `controllerchange`, which an uncontrolled page never gets |
| D2  | No `clientsClaim` | closed | Keep the generated worker without `clientsClaim` | loop-plan | claiming swaps the controller under a running page (what D1 of app-update-flow avoids) and on an uncontrolled page still leaves nothing waiting for the button |
