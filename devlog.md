<!--
 * @Author: Rui Li
 * @Date: 2020-05-13 20:47:58
 * @LastEditTime: 2020-06-11 18:21:23
 * @Description: 
 * @FilePath: /VisPubFigures/devlog.md
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