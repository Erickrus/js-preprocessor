/* System.Scripting */

RegExp.prototype.execAll = function(string) {
    var match = null;
    var matches = new Array();
    while (match = this.exec(string)) {
        matches.push(match);
    }
    return matches;
};

/*class*/ function ScriptPreprocessor() {
   /*String*/ this.formatString=function(/*String*/ pSource) {
      pSource = pSource.replaceAll("\r\n","\n")
               .replaceAll("\r","\n")
               .replaceAll("\n","#p#")
               .replaceAll("[","#l_bracket#")
               .replaceAll("]","#r_bracket#")
               .replaceAll("<%","[")
               .replaceAll("%>","]");
      return pSource;
   };
   /*String*/ this.unformatString=function(/*String*/ pSource) {
      pSource = pSource.replaceAll("#p#","\n")
         .replaceAll("[","<%")
         .replaceAll("]","%>")
         .replaceAll("#l_bracket#","[")
         .replaceAll("#r_bracket#","]");
      return pSource;
   };

   // <%sql:db\n ... #%>
   /*String*/ this.processLongSQL = function(/*String*/ pSource) {
      if (pSource.indexOf("[#sql:") ==0) {

           //Retrieve database Name from the first line sql:databasename
         var/* String */ dbName = pSource.substring(
                            pSource.indexOf("[#sql:")+6,
                            pSource.indexOf("#p#"));

         //Simulate for Long String
         //The variables replacement and brackets enclosure are reused
         pSource = "[\""+pSource.substring(pSource.indexOf("#p#"), pSource.length-2) + "\"]";
         pSource = this.unformatString(this.processLongString(pSource));

         var/* ArrayList */ lines = pSource.split("\n");
         var/* String */ result ="";
         for (var/*int*/ i=0;i<lines.length;i++) {
            //This piece of codes are ugly, try to adjust the string from Long String Process
            //And convert to SQL Statement
            var/* String */ sqlLine = lines[i];

            //If the line endsWith suffix(\n), remove the suffix
            var/* String */ suffix = "\\n\"";
            if (sqlLine.indexOf(suffix, sqlLine.length - suffix.length) !== -1) {
               sqlLine = sqlLine.substring(0,sqlLine.length-3)+"\"";
            }

            //If the line is a namely empty string such as "" or +"", skip it
            if (sqlLine != "\"\"" && sqlLine != "+\"\"") {
               //for string of following cases: +"..." or "..."
               //convert to databasename.exec("...");
               //make sure all sql are written in 1 line, multiple lines are not supported
               if (sqlLine.indexOf("+\"") == 0) {
                  sqlLine = dbName+".exec("+sqlLine.substring(1, sqlLine.length)+");";
               } else {
               	  sqlLine = dbName+".exec("+sqlLine+");";
               }
               //Concatenate the sql line with "\n"
               result += sqlLine + "\n";
            }
         }
         return this.formatString(result);
      } else {
         return pSource;
      }
   };

   // <%# ... #%>
   /*String*/ this.processCSVString = function(/*String*/ pSource){
      if (pSource.indexOf("[#") ==0) {
      	 //As all data is delimited by \t
      	 //when converting to Array
      	 //the inner " will be treated as \"
      	 var/*String*/    pData = this.unformatString(pSource).replaceAll("\"","\\\"");
      	 var/*ArrayList*/ lines = pData.split("\n");
      	
      	 var/*String*/ sResult = "[";

         for (var/*int*/ i=0;i<lines.length;i++) {
            var/*String*/ currentLine = "";

            //trim in the first line for [# and last line #]
      	    if (i==lines.length-1)
      	       lines[i] = lines[i].substring(0, lines[i].length-3);
      	    if (i==0)
      	       lines[i] = lines[i].substring(4,lines[i].length);
      	
      	    //skip the empty lines
      	    if (lines[i].length>0 && lines[i]!="") {
      	       currentLine = "[";
      	       var/*ArrayList*/ cells = lines[i].split("\t");
      	
      	       //Assemble the cell content, and enclosure with "..."
      	       for (var/*int*/ j=0;j<cells.length;j++){
      	       	  if (j!=cells.length-1){
      	             currentLine += "\""+cells[j]+"\""+",";
      	          } else {
      	             currentLine += "\""+cells[j]+"\"";
      	          }
      	       }
      	       currentLine += "]\n";
      	
      	       //If it is not the first line, add "," in the front
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
   /*String*/ this.processLongString = function(/*String*/ pSource) {
      if (pSource.indexOf("[\"") ==0) {
      	var/*String*/    pData = this.unformatString(pSource).replaceAll("\"","\\\"");
      	var/*ArrayList*/ lines = pData.split("\n");
      	var/*String*/    sResult = "";
      	
      	//Process lines and add quotes
      	for (var/*int*/ i=0;i<lines.length;i++) {

      	   //trim in the first line for [" and last line "]
      	   if (i==lines.length-1)
      	      lines[i] = lines[i].substring(0, lines[i].length-4);
      	   if (i==0)
      	      lines[i] = lines[i].substring(4,lines[i].length);

           //process line beginning:
           //first line: "...   , other line +"...
      	   if (i==0) {
      	      sResult = "\"" + lines[i];
      	   } else {
      	      sResult += "+\"" + lines[i];
      	   }
      	
      	   //process line ending:
      	   //Append \n" in the rear of the string
      	   if (i!=lines.length-1) {
      	      sResult += "\\n"+ "\"\n";
      	   } else {
      	      sResult += "\"";
      	   }
      	}
      	sResult = this.formatString(sResult);
      	

      	//Replace variables in the given context
      	//
      	//All variables are defined as      "...${variable}..."
      	//Finally, the will be assembled as "..." + variable + "..."
      	//Unlike sprintf, this implementation is straightforward with +
      	//
      	//The approach is straight forward, to use regular expression
      	//to find out all the occurrence of ${...} then replace them
      	//
      	
        var/*int*/       iLast = 0;
      	var/*ArrayList*/ arrRegexResult = /\${[^{}]*}/g.execAll(sResult);
      	var/*String*/    sVarReplResult="";

        for (var/*int*/ i=0;i<arrRegexResult.length;i++) {
           var/*String*/ matchedString = arrRegexResult[i][0];
           var/*int*/    matchedIndex  = arrRegexResult[i].index;

           var/*int*/    iLeft = arrRegexResult[i].index;
           var/*int*/    iEnd  = iLeft + arrRegexResult[i][0].length;
           var/*String*/ sPre  = sResult.substring(iLast, iLeft);
           var/*String*/ sRep  =  "\" + "+ arrRegexResult[i][0].substring(2,arrRegexResult[i][0].length-1)+" + \"";

           sVarReplResult += sPre + sRep;
           iLast = iEnd;
        }
        //added the last part
        sVarReplResult += sResult.substring(iLast, sResult.length);

        return sVarReplResult;

      } else {
      	return pSource;
      }
   };

   /*String*/ this.preprocess = function(/*String*/ pSource) {
      pSource = this.formatString(pSource);

      var/*String*/  sResult = "";
      var/*ArrayList*/ arrProcessString = [];
      var/*ArrayList*/ arrRegexResult = /\[[^\[\]]*\]/g.execAll(pSource);

      //The approach is to use the regular expression to handle the search and replacement
      //first of all convert all string from <% %> to [ ]
      //of course preprocess [ ] to l_bracket, l_bracket at first


      for (var/*int*/ i=0;i<arrRegexResult.length;i++) {
         var/*String*/  matchedString = arrRegexResult[i][0];
         var/*int*/     matchedIndex = arrRegexResult[i].index;
         var/*String*/  processString = matchedString;

         //Then figure out all the occurrences
         //and try to check and convert, if they conform to the designed syntax
         processString = this.processLongString(processString);
         processString = this.processLongSQL(processString);
         processString = this.processCSVString(processString);
         arrProcessString.push(processString);
      }

      //for each replacement, assemble them back into the source
      //then form a final result string
      var/*int*/ iLast = 0;
      for (var/*int*/ i=0;i<arrRegexResult.length;i++) {
         var/*int*/    iLeft = arrRegexResult[i].index;
         var/*int*/    iEnd  = iLeft + arrRegexResult[i][0].length;
         var/*String*/ sPre = pSource.substring(iLast,iLeft);
         var/*String*/ sRep = arrProcessString[i];
         sResult += sPre + sRep;
         iLast = iEnd;
      }
      sResult += pSource.substring(iLast, pSource.length);
      sResult = this.unformatString(sResult);

      return sResult;
   };
};

var/*ScriptPreprocessor*/ scripting = new ScriptPreprocessor();

/*
Demo as below:

Console.Clear();
Console.WriteLine("Hello World");
var i=0;
<%#sql:db
select * from dual where ${i}=1;
select * from dual where ${i}=1;
#%>
var s=<%"aa
a"%>;
var b=<%#
1	2	c
3	4
#%>;

*/
