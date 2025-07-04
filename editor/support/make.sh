cd language
if [ ! -f antlr-4.13.0-complete.jar ]; then
  wget https://github.com/antlr/website-antlr4/raw/gh-pages/download/antlr-4.13.0-complete.jar
fi
java -jar antlr-4.13.0-complete.jar -Dlanguage=JavaScript QubecTalk.g4 -visitor -o ../intermediate
cd ..

npm run build