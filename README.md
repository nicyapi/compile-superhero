<!--
<a href="https://marketplace.visualstudio.com/items?itemName=Wscats.eno"><img src="https://img.shields.io/badge/Download-8k+-orange" alt="Download" /></a>
<a href="https://marketplace.visualstudio.com/items?itemName=Wscats.eno"><img src="https://img.shields.io/badge/Macketplace-v2.00-brightgreen" alt="Macketplace" /></a>
<a href="https://github.com/Wscats/compile-hero"><img src="https://img.shields.io/badge/Github Page-Wscats-yellow" alt="Github Page" /></a>
<a href="https://github.com/Wscats"><img src="https://img.shields.io/badge/Author-Eno Yao-blueviolet" alt="Eno Yao" /></a>
<a href="https://github.com/Wscats"><img src="https://api.netlify.com/api/v1/badges/b652768b-1673-42cd-98dd-3fd807b2ebca/deploy-status" alt="Status" /></a>

[English](https://github.com/Wscats/compile-hero/blob/master/README.md)

-->


# Features

Compared to compile-hero:

- SASS was not compiled at all
- Most files types were compiling fine, but crashed the extension-host on vscode if they contained an error, or did just do nothing or create empty files
- Added an editor notification to show compile errors 
- compile status (failed/successful) is now correctly shown in the statusbar
- Added test files
- Added a missing dependency
- Removed a function that could be used to connect to a chinese server to register the IP and other data
- Removed necessary files
- Added test files

# Super Compiler

Easily work with `less, sass, scss, typescript, jade, pug and jsx` files in Visual Studio Code.

Compile on save `(ctrl+s)` or select `Compile File(s)` on right-click menu item for `less, sass, scss, typescript, jade, pug and jsx` files without using a build task.

<img src="https://BananaAcid.github.io/compile-superhero/screenshots/1.gif" />

<br/>

<img src="https://BananaAcid.github.io/compile-superhero/screenshots/3.gif" />

- Compile `less, sass, scss, typescript, jade, pug and jsx` on save.
- Support autoprefixer for `less, scss, scss`.
- Support to open `html` files to preview in browser.
- minify `.js` and `.css` files.

|Before Compile|After Compile|
|-|-|
|.pug|.html|
|.jade|.html|
|.scss/.sass|.css|
|.less|.css|
|.ts/.tsx|.js(JSX)|
|.js(ES6)|.js(ES5)|

Easy to use. When you writing a file, press save `ctrl+s` to generate the compiled file in the same directory. I hope you can get rid of the constraint of `gulp` or `webpack`😁 or external helper tools.

# Configuration

Click to open the extension management interface `Configure Extension Settings`, You can change the path of the project compilation directory, or toggle the switch of language.

<img src="https://BananaAcid.github.io/compile-superhero/screenshots/5.gif" />
# Open In Browser

Right click the `html` file in the directory menu, and the `open in browser` option will appear. You can preview the page in the chrome browser only.

<img src="https://BananaAcid.github.io/compile-superhero/screenshots/2.gif" />

# Close Port

At some point, you may be using ports for some services. You can use the `close port` command to close. (OSX/Linux, not Windows)

<img src="https://BananaAcid.github.io/compile-superhero/screenshots/4.gif" />

# Thanks to Wscats for the original extension

[<img src="https://avatars1.githubusercontent.com/u/17243165?s=460&v=4" width="60px;"/><br /><sub>Eno Yao</sub>](https://github.com/Wscats)

And his compile-hero extension: 
 [message and like it](https://marketplace.visualstudio.com/items?itemName=Wscats.qf&ssr=false#review-details)


# License

Compile Hero is released under the [MIT](http://opensource.org/licenses/MIT).
