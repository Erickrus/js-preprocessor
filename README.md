js-preprocessor
===============
<br/>
js-preprocessor simply implement a shell-like string preprocessor. It enables javascript to work like:<br/>
var s = <%"Hello World ${Username}<br/>
This is fun"%><br/>
<br/>
It also enables the direct paste from excel data, delimited with \t. System will automatically convert them into Arrays<br/>
<%#<br/>
1 2 3 5<br/>
2 4 5 5<br/>
#%><br/>

Finally simplify the sql statement<br/>
<br/>
<%#sql:db<br/>
select * from table1;<br/>
insert into ... ;<br/>
drop table table2;<br/>
#%><br/>
