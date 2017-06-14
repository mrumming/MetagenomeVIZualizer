# MetagenomeVIZualizer

The MetagenomeVIZualizer web application is part of the _MetaStone_ project (for more information on the _MetaStone_ project visit [github:MetaStone](https://github.com/mrumming/MetaStonePhenoPointer)). The Visualizer shows (meta)information of your data as charts in order to enable comparisons. After selecting arbitrary collections (subsets) of your data (with samples as smallest selectable units), you are able to select the context by choosing a characteristical group and a subcharacteristic. Now your data can be visualized based on that context. Different global or plot specific preferences allow the definition of thresholds, switching between visualisations and modes as well as editing of your datasets, exports of plots and more, all in a dynamic way.

## [Application Setup](#application-setup)

### [How to run the application](#how-to-run-the-application)

You can run the application by:

1.  calling a locally deployed installation within your browser
2.  or a typical deployment on your webserver (depends on your existing setup).

### [How to load data](#how-to-load-data)

Data is loaded by the `data` attribute given to the URL. Note that your data must be ziped and ends with `.zip`. GZIP is another compression method and is not supported. The name of the archive has to be `<filename>.json.zip` where `<filename>.json` is the filename of the dataset contained in the archive.

**Example 1:**

If the application is deployed on your webserver (SSL enabled) within the location “datavisualizer” and your datasets are stored in the “data” directory located in the projects directory:

`https://FQDN/datavisualizer/index.html?data=data/mock_infer.json.zip`

**Example 2:**

If the application is locally deployed and your datasets are stored in the “data” directory located in the MVIZ directory:

`file:///Users/mrumming/MVIZ/index.html?data=data/mock_infer.json.zip`


* * *

© 2016 Madis Rumming, Computational Metagenomics, CeBiTec, Bielefeld University
Released under BSD 3 clause license.
