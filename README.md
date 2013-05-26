js-preprocessor
===============

js-preprocessor simply implement a shell-like string preprocessor. It enables javascript to work like:
var s = <%"Hello World ${Username}
This is fun"%>

It also enables the direct paste from excel data, delimited with \t. System will automatically convert them into Arrays
<%#
1 2 3 5
2 4 5 5
#%>

Finally simplify the sql statement

<%#sql:db
select * from table1;
insert into ... ;
drop table table2;
#%>
