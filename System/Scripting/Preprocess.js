/* Scripting */


RegExp.prototype.execAll = function(string) {
    var match = null;
    var matches = new Array();
    while (match = this.exec(string)) {
        matches.push(match);
    }
    return matches;
};

function ScriptingProcessor() {
/*
This will support the replacement of following syntax:
CSV Type, just content
<% csv
... ...
%>

Long String, with Varirable Replacement
<% string
... ...
%>

*/
   this.formatString=function(pSource) {
      pSource = pSource.replaceAll("\r\n","\n")
               .replaceAll("\r","\n")
               .replaceAll("\n","#p#")
               .replaceAll("[","#l_bracket#")
               .replaceAll("]","#r_bracket#")
               .replaceAll("<%","[")
               .replaceAll("%>","]");
      return pSource;
   };
   this.unformatString=function(pSource) {
      pSource = pSource
         .replaceAll("#p#","\n")
         .replaceAll("[","<%")
         .replaceAll("]","%>")
         .replaceAll("#l_bracket#","[")
         .replaceAll("#r_bracket#","]");
      return pSource;
   };
   // <%sql:db\n ... #%>
   this.processLongSQL = function(pSource) {
      if (pSource.indexOf("[#sql:") ==0) {
      	 var p0 = pSource.indexOf("[#sql:")+6;
         var p1 = pSource.indexOf("#p#");
         var dbName = pSource.substring(p0,p1);

         pSource = "[\""+pSource.substring(p1, pSource.length-2) + "\"]";
         //alert(pSource);
         pSource = this.unformatString(this.processLongString(pSource));
         var lines = pSource.split("\n");
         var result ="";
         for (var i=0;i<lines.length;i++) {
            var sql = lines[i];
            
            var suffix = "\\n\"";
            if (sql.indexOf(suffix, sql.length - suffix.length) !== -1) {
               sql = sql.substring(0,sql.length-3)+"\"";
            }
            
            if (sql != "\"\"" && sql != "+\"\"") {
               if (sql.indexOf("+\"") == 0) {
                  sql = dbName+".exec("+sql.substring(1, sql.length)+");";
               } else {
               	  sql = dbName+".exec("+sql+");";
               }
               result += sql + "\n";
            }
         }
         //alert(result);
         return this.formatString(result);
      } else {
         return pSource;
      }
   };
   
   // <%# ... #%>
   this.processCSVString = function(pSource){
      if (pSource.indexOf("[#") ==0) {
      	 var pData = this.unformatString(pSource).replaceAll("\"","\\\"");
      	 var lines = pData.split("\n");
      	 
      	 var sResult = "[";

         for (var i=0;i<lines.length;i++) {
            var currentLine = "";
      	    if (i==lines.length-1)
      	       lines[i] = lines[i].substring(0, lines[i].length-3);
      	    if (i==0)
      	       lines[i] = lines[i].substring(4,lines[i].length);
      	    if (lines[i].length>0 && lines[i]!="") {
      	       currentLine = "[";
      	       var cells = lines[i].split("\t");
      	       for (var j=0;j<cells.length;j++){
      	       	  if (j!=cells.length-1){
      	             currentLine += "\""+cells[j]+"\""+",";
      	          } else {
      	             currentLine += "\""+cells[j]+"\"";
      	          }
      	       }
      	       currentLine += "]\n";
      	       if (sResult == "[") {
      	          sResult += currentLine;
      	       } else {
      	          sResult += ","+currentLine;
      	       }
      	    }
      	 }
      	 sResult+="]";
      	 sResult = this.formatString(sResult);
      	 return sResult;
      } else {
         return pSource;
      }
   };
   // <%" ... "%>
   this.processLongString = function(pSource) {
      if (pSource.indexOf("[\"") ==0) {
      	var pData = this.unformatString(pSource).replaceAll("\"","\\\"");
      	var lines = pData.split("\n");
      	var sResult = "";
      	for (var i=0;i<lines.length;i++) {
      	   if (i==lines.length-1)
      	      lines[i] = lines[i].substring(0, lines[i].length-4);
      	   if (i==0)
      	      lines[i] = lines[i].substring(4,lines[i].length);

      	   if (i==0) {
      	      sResult = "\"" + lines[i];
      	   } else {
      	      sResult += "+\"" + lines[i];
      	   }
      	   if (i!=lines.length-1) {
      	      sResult += "\\n"+ "\"\n";
      	   } else {
      	      sResult += "\"";
      	   }
      	}
      	sResult = this.formatString(sResult);
      	
      	//replace variables
        var iLast = 0;
      	var regResult = /\${[^{}]*}/g.execAll(sResult);
      	var sResult2="";
        for (var i=0;i<regResult.length;i++) {
           var matchedString = regResult[i][0];
           var matchedIndex = regResult[i].index;

           var iLeft = regResult[i].index;
           var iEnd  = iLeft + regResult[i][0].length;
           var sPre =  sResult.substring(iLast,iLeft);
           var sRep  =  "\" + "+ regResult[i][0].substring(2,regResult[i][0].length-1)+" + \"";

           sResult2 += sPre + sRep;
           iLast = iEnd;
        }
        sResult2 += sResult.substring(iLast, sResult.length);
        return sResult2;
   	
      } else {
      	return pSource;
      }
   };
   
   this.preprocess = function(pSource) {
      pSource = this.formatString(pSource);
      var arrProcessString = [];
      var sResult = "";   
      var regResult = /\[[^\[\]]*\]/g.execAll(pSource);
      
      for (var i=0;i<regResult.length;i++) {
         var matchedString = regResult[i][0];
         var matchedIndex = regResult[i].index;
         var processString = matchedString;// +"PPP";
         //
         processString = this.processLongString(processString);
         processString = this.processLongSQL(processString);
         processString = this.processCSVString(processString);
         arrProcessString.push(processString);
      }
      
      var iLast = 0;
      for (var i=0;i<regResult.length;i++) {
         var iLeft = regResult[i].index;
         var iEnd  = iLeft + regResult[i][0].length;
         var sPre = pSource.substring(iLast,iLeft);
         var sRep = arrProcessString[i];
         sResult += sPre + sRep;
         iLast = iEnd;
      }
      sResult += pSource.substring(iLast, pSource.length);
      sResult = this.unformatString(sResult);
      //Console.WriteLine(sResult);
      return sResult;
   };
};

var scripting = new ScriptingProcessor();

/*

Console.Clear();
Console.WriteLine("Hello World");
var i=0;
<%#sql:db
select * from dual where ${i}=1;
select * from dual where ${i}=1;
a#%>
<%"aa
a"%>
<%#
1	2	c
3	4
#%>
*/