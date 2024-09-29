const express = require('express');
const { PDFDocument, rgb } = require('pdf-lib');
const fs = require('fs');
const xml2js = require('xml2js');
const app = express();

app.use(express.static('public'));  // Serve static HTML files

// Endpoint to generate and download PDF
app.post('/generate-pdf', async (req, res) => {
   try {
      const formXml = fs.readFileSync('data.xml', 'utf-8');
      const stylesXml = fs.readFileSync('styles.xml', 'utf-8');

      const parser = new xml2js.Parser();
      const form = await parser.parseStringPromise(formXml);
      const styles = await parser.parseStringPromise(stylesXml);

      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([600, 400]);

      const fields = form.form.field;
      let yPosition = 350;  // Start position

      for (const field of fields) {
         const name = field.$.name;
         const value = field._;

         const style = styles.styles.style.find(s => s.$.element === name);
         const font = style.$.font || 'Helvetica';
         const size = parseFloat(style.$.size) || 12;
         const color = style.$.color === 'blue' ? rgb(0, 0, 1) :
                       style.$.color === 'green' ? rgb(0, 1, 0) : rgb(0, 0, 0);

         page.drawText(`${name}: ${value}`, {
            x: 50,
            y: yPosition,
            size: size,
            color: color
         });

         yPosition -= 40;  // Move down for the next field
      }

      const pdfBytes = await pdfDoc.save();

      res.setHeader('Content-Disposition', 'attachment; filename="document.pdf"');
      res.setHeader('Content-Type', 'application/pdf');
      res.send(Buffer.from(pdfBytes));
   } catch (error) {
      res.status(500).send('Error generating PDF: ' + error.message);
   }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
