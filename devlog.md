<!--
 * @Author: Rui Li
 * @Date: 2020-05-13 20:47:58
 * @LastEditTime: 2020-07-06 20:34:00
 * @Description: 
 * @FilePath: /VisImageNavigator.github.io/devlog.md
 -->
python -m http.server 10028

New features:
(1) Rescale the window to fit the images.
(2) Change the background in the small views to the windows background. 
(3) Thicken the border of the small views.  
(4) Add scent to the page navigator. Scent means a small view to show the statistics of the navigator - which year and how many images in each of the four conferences. 
(5) Vis, SciVis inform VAST.. .icon colors make it not so saturated. Check out those calm colors from colorbrewer2.org  
(6) New keyword search -> Keyword(s) search 
(7) add Keywords icon (which is clickable and will lead to the keyVis website.) 
(8) VisPubFigures site name: VisPubFigures 
(9) Update the database 
(10) Add year slider 
(11) Fix keyword duplicates  
(12) add list version (only show UP papers) 

reference website: http://viziometrics.org/


(1) 把工具行合并
(2) 删掉year, conference
* cite里面如果点击另外一个dot，原先的消失了
* 尝试合并cite与另外两个功能
* navigation bar上面显示一个dot就行了  (done)
* 修改颜色year  (done)
* 修改工具的名称  (done)
* 加一个author的droplist


https://www.codicode.com/art/how_to_draw_on_a_html5_canvas_with_a_mouse.aspx
draw rectangle
https://cancerberosgx.github.io/demos/misc/fabricRectangleFreeDrawing.html?d=9

1. remove select toolbox
2. shorten the search box
3. add author droplist
4. change the title of the tool
5. only show dots on navigation bar
6. change the color of year slider
7. change the correctness of UP papers



1. use deduped name column, remove 00001 pattern.  (done)
2. convert 7 years meta-files to the individual files and then send to Prof. Chen.   ()
3. prepare the image dataset database.  (done)
4. UP papers -> show papers  (done)
5. add a dropdown, choose images count, Torsen  
6. 32 pages 6466 images in total  (done)
7. add some data statistics to about page.
8. add a histogram on scent.
9. change the order of the name shown in the interface


Vis-10.1109-VISUAL.1991.175792-p148-C_2: correct
2000 missing?


最小化的bug  (done)

van, 然后顺序颠倒显示，放到google sheet里面

list里面click image显示的不对  (done)


把所有人的名字合到一起来



2019年的name deluped

formalResults/validation_results/1998/Vis-10.1109-VISUAL.1998.745294-p127-C_4.txt  (problematic)
formalResults/validation_results/1999/Vis-10.1109-VISUAL.1999.809865-p35-C_4.txt
formalResults/validation_results/2000/InfoVis-10.1109-INFVIS.2000.885097-p105-C_4.txt (done)
formalResults/validation_results/2012/InfoVis-10.1109-TVCG.2012.196-p2613-J_6.txt
formalResults/validation_results/2012/InfoVis-10.1109-TVCG.2012.196-p2613-J_7.txt
formalResults/validation_results/2015/SciVis-10.1109-TVCG.2015.2467434-p747-J_3.txt
formalResults/validation_results/2019/VAST-10.1109-TVCG.2019.2934654-p1001-J_7.txt



http://dx.doi.org/10.1109/VISUAL.1997.663848
http://dx.doi.org/10.1109/VISUAL.1997.663851  
title is not correct


1. tool: change name to VisImageNavigator (VIN)  (done)
2. for the view detail view, add next and previous button  (done)
idea: for the paper, create a global array, then find image in this array based on the index.
3. for the view detail view, make it a little bit narrower. (done)
4. flip the author names (done)
5. add the copyright notice
“© © 2020 IEEE. Personal use of this material is permitted. Permission from IEEE must be obtained for all other uses, in any current or future media, including reprinting/republishing this material for advertising or promotional purposes, creating new collective works, for resale or redistribution to servers or lists, or reuse of any copyrighted component of this work in other works.”   (done)
6. add figure/table button to separate these two.   (done)
7. please update the author duped data - Petra cleaned it up in the VisPubData data. Please grab a new version. (done)
8. upload images  (done)

9. 修复scale的bug

2010 data is not complete


1. reupload images
2. 更新vin的数据库
3. 更新网页，显示1-6的内容


06/23/2020


> visannotation

1. model markdown document
add a tab to VIN called "how the model works"?
"Try our model"

2. About
change the figure with the new figures in the paper, and set its' width the whole screen.

3. change the background color of navigator to keyvis

4. add the abstract

5. about page, enlarge font size

6. add getting started.
Intro to Vis29k.
insert figure here
> (1) What image (figure and table) data can you find here?
insert data statistics, can be found in the paper
> (2) What are the image data? 
Download the data.
> (3) What image extraction methods we designed? 
we combine CNN-based figure extraction and human curation. 
Our models combine F-RCNN and YOLOv3 and you can try it here (give a hyperlink to here).

7. change the icons, list and gallaery (done)

10. add the social platform share function  (done)
https://sharingbuttons.io/
8. write a program to update the meta files to catch up the real figure size (1990 and 1995) (done)

9. store the page status.


06/23/2020 logs

* Redesigned the style of the navigation bar to keep it consistent with keyvis.


dataset:  

add new column to indicate whether it is a table or figure

infovis and scivis year not correct  (done)
We used two CNN models, Faster

What is our image extraction method?
change the link in the configuaration to the short link.

you can download pretrained model to test on new papers

Cnn model (delete s) configurations.


author
Have you tried VIN <...>?

Title add to email sharing.
Have you tried VIN <...>?

workflow: matching
1. can't find it.
2. offset > 20.
use the original

or, update the size.


07/01/2020
1. run the python code to generate citation and reference list
2. show lollipop chart for the statistics
3. show a list for details


meeting notes
1. if the type has 15-6
2. if the capIdx


##### 07/06/2020

1. mouse over, show all coders, and show their annotation date.

