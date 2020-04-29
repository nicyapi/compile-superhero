# Features

Compared to compile-hero:

- Added support for sass/scss files to be able to inlcude other sass/scss files
- Added support for sourcemaps
- Added support to disable .min.* files
- Added a configuration screen for local workfolder (see screenshot below)
- Added a command to generate all superhero settings into a local project folder
- Fixed SASS was not compiled at all
- Fixed most files types were compiling fine, but crashed the extension-host on vscode if they contained an error, or did just do nothing or create empty files
- Added an editor notification to show compile errors 
- Fixed Compile status (failed/successful) is now correctly shown in the statusbar
- Added test files
- Added a missing dependency
- Removed a function that could be used to connect to a chinese server to register the IP and other data
- Removed necessary files
- Added test files
- Added an option to enable compiling files in mixin (`mixin` and `mixins`) folders, **this is off by default**!

# Compile-Superhero

Easily work with `less, sass, scss, typescript, jade, pug and jsx` files in Visual Studio Code.

Compile on save `(ctrl+s)` - or select `Compile File(s)` at the right-click menu for `less, sass, scss, typescript, jade, pug and jsx` files without using a build task.

<img src="https://BananaAcid.github.io/compile-superhero/screenshots/1.gif" />

<br/>

<img src="https://BananaAcid.github.io/compile-superhero/screenshots/3.gif" />

- Compile `less, sass, scss, typescript, jade, pug and jsx` on save
- Support autoprefixer for `less, scss, scss`
- Support to open `html` files to preview in chrome browser
- minify `.js`, `.css` and `.html` files

|Before Compile|After Compile|
|-|-|
|.pug|.html|
|.jade|.html|
|.scss/.sass|.css|
|.less|.css|
|.ts/.tsx|.js(JSX)|
|.js(ES6)|.js(ES5)|

Easy to use. When you writing a file, press save (<kbd>ctrl</kbd> + <kbd>s</kbd>) to generate the compiled file in the same directory (or different if changed in the settings). No need for `gulp` or `webpack` or external helper tools.

# Configuration

## Compile-Hero settings view

You may want to use the command `Open settings` to open the settings on an easy to configure pane.

<img src="https://BananaAcid.github.io/compile-superhero/screenshots/settings_small.png" />

Right now, you could click on the "Features" tab, to list all available settings and commands.

## VSCode settings overview
Click to open the extension management interface (`Configure Extension Settings`), You can change the path of the project compilation directory, or enable/disable the compilation of any supported file format.

- Project-wide settings are configured using the standard `settings.json` file (i.e. Workspace Settings).

## Generate local default settings at project

You might want to locally modify the settings of this extension for easy modification/distribution with the project.

You can use the `Generate Compile-Superhero's default settings locally` command to generate it:
it will create a `.vscode/settings.json` or add missing entries, to your project folder.


<!-- img src="https://BananaAcid.github.io/compile-superhero/screenshots/5.gif" / -->

# Open In Browser

Right click the `html` file in the directory menu, and the `open in browser` option will appear. You can preview the page using a fullfile path (security restrictions - not all might work) in the chrome browser only.

- But it would be better to use the [LiveServer by Ritwick Dey](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer)

<img src="https://BananaAcid.github.io/compile-superhero/screenshots/2.gif" />

# Close Port

At some point, you may be using ports for some services. If they are blocked, you can use the `close port` command to close them. (OSX/Linux, not Windows)

<img src="https://BananaAcid.github.io/compile-superhero/screenshots/4.gif" />


# Thanks to Wscats for the original extension

[<img src="https://avatars1.githubusercontent.com/u/17243165?s=460&v=4" width="60px;"/><br /><sub>Eno Yao</sub>](https://github.com/Wscats)

And his compile-hero extension: 
 [message and like it](https://marketplace.visualstudio.com/items?itemName=Wscats.qf&ssr=false#review-details)


# License

Compile Hero is released under the [MIT](http://opensource.org/licenses/MIT).
