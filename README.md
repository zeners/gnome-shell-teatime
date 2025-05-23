**Premise**

Before you do anything, please make sure, that you have the following packages installed:

 - libglib2.0-dev
 - intltool
 - gnome-common
 
The name of the package may vary from distribution to distributon. The first two packages provide m4-files needed for the generation of the configure script. The files in need are:

- intltool.m4
- gsettings.m4

They should be located somewhere in `/usr/share/aclocal`.

**Installation**

If everything is in place, run

    ./autogen.sh

to generate the configure script. If everything worked well, do:

    ./configure --prefix=/usr && make

To install the extension to your home directory, run:

    make local-install

Or to install it for all users you need administrator rights. Thus you've to use something like sudo or become root via su. Using sudo, simply run:

    sudo make install

In case you can't find the applet in gnome-tweak-tool, restart gnome-shell (using <kbd>Alt</kbd>
+<kbd>F2</kbd>, enter: <kbd>r</kbd>).

If you wish to translate TeaTime to your language, have a look at the directory `po`.

A handy zip file can be created using:

* via build-system 
  ```shell
  make zip
  ```
* or via gnome-extensions tools (this is the same you get via http://extensions.gnome.org)
  ```shell
  gnome-extensions pack --podir=../po --schema=schemas/org.gnome.shell.extensions.teatimer.gschema.xml --extra-source=icon.js --extra-source=utils.js --extra-source=utilities-teatime.svg --force src
  ```

Thanks to  Thomas Liebetraut for the new build system.
Get the latest version from:  https://github.com/tommie-lie/gnome-shell-extensions-template


**Branches**

* master: for AUR-Package - contains system-symbol used as notification-icon
* teatimer: for http://extensions.gnome.org - follows extensions guidelines 

**Contribution**

Patches are welcome. But please make sure the code you contribute is formated properly.
Please run `beautify-code.sh` before sending pull requests. Therefore, you'll need to install the
python tool `js-beautify`, e.g. via `pip install jsbeautifier`.
