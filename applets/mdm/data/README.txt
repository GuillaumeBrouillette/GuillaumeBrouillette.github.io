Sample meshes of the GTS library
================================

The .gts files in this folder are sample files of GTS, the GNU Triangulated
Surface Library. They are distributed on the GTS website:

    https://gts.sourceforge.net/samples.html

They are reproduced here without modification (the files on the GTS website
are gzip-compressed) so that the applet in the parent folder can load them.
The GTS library itself is free software released under the LGPL licence:

    https://gts.sourceforge.net/

File format: first line "number of vertices, edges, triangles", then one
vertex per line (x y z), one edge per line (two vertex indices) and one
triangle per line (three edge indices). Indices start at 1.
