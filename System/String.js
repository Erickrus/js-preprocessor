/* System */

//@function=replaceAll
String.prototype.replaceAll = function(target, replacement) {
  return this.split(target).join(replacement);
};
//@end

//@function=trimSpaces
String.prototype.trimSpaces = function () {
	var phrases = this.split(" ");
	var result = "";
	for (var i = 0; i < phrases.length; i++) {
		if (!phrases[i]=="") {
			if (result=="") {
				result = phrases[i];
			} else {
				result += " " + phrases[i];
			}
		}
	}
	return result;
}
//@end

//@function=contains
String.prototype.contains = function(stringSet) {
  for (var i=0;i<stringSet.length;i++) {
     if (this.indexOf(stringSet[i]) >= 0)
        return true;
  }
  return false;
};
//@end

//@function=onlyContains
String.prototype.onlyContains = function(stringSet) {
   for (var i=0;i<this.length;i++) {
      var currentChar = this[i];
      if (!stringSet.contains(currentChar))
         return false;
   }
   return true;
};
//@end

//@function=padding
String.prototype.padding = function (val, len) {
   var s = "";
   for (var i=0;i<len;i++)
      s+=val;
   return s;
};
//@end


