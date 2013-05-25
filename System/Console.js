var /*class*/ Console = {
   WriteLine : function(s) {
      document.getElementById("console").value += s +"\n";
   },
   Write : function(s) {
      document.getElementById("console").value += s;
   },
   Clear : function(s) {
      document.getElementById("console").value = "";
   }
};
