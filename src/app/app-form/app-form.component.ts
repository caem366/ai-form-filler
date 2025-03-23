import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import axios from 'axios';

@Component({
  selector: 'app-app-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './app-form.component.html',
  styleUrls: ['./app-form.component.css'],
})
export class AppFormComponent {
  form: FormGroup;

  // Azure Computer Vision endpoint and API key
  private azureEndpoint = 'https://ai-form-filler-vision.cognitiveservices.azure.com/';
  private azureApiKey = '1UxVuPUEArmK8cfvMoBlrIDJbSdZaJkvB6NSFd1kehjneOVKIbdXJQQJ99BCACYeBjFXJ3w3AAAFACOGlEMa'; 

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      dob: ['', Validators.required],
      address: ['', Validators.required],
      city: ['', Validators.required],
      province: ['', Validators.required],
    });
  }

  async onFileUpload(event: Event): Promise<void> {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      try {
        // Send the image to Azure Computer Vision API
        const response = await axios.post(
          `${this.azureEndpoint}vision/v3.2/read/analyze`,
          file,
          {
            headers: {
              'Ocp-Apim-Subscription-Key': this.azureApiKey,
              'Content-Type': 'application/octet-stream',
            },
          }
        );
  
        // Get the operation location for the result
        const operationLocation = response.headers['operation-location'];
  
        // Poll the operation location to get the result
        const readResults = await this.pollReadResult(operationLocation);
  
        // Extract text and prefill the form
        const extractedData = this.parseExtractedText(readResults);
        this.form.patchValue(extractedData);
        alert('Form pre-filled with extracted data!');
      } catch (error) {
        console.error('Error during OCR:', error);
        alert('Failed to extract data from the uploaded document.');
      }
    }
  }

  

  // async onFileUpload(event: Event): Promise<void> {
  //   // Mocked OCR response for testing
  //   const mockReadResults = [
  //     {
  //       lines: [
  //         { text: 'First Name: Jane' },
  //         { text: 'Last Name: Smith' },
  //         { text: 'Date of Birth: 1985-05-15' },
  //         { text: 'Address: 456 Elm St' },
  //         { text: 'City: Test City' },
  //         { text: 'Province: Test Province' },
  //       ],
  //     },
  //   ];

  //   // Simulate the parseExtractedText function with mocked data
  //   const extractedData = this.parseExtractedText(mockReadResults);
  //   this.form.patchValue(extractedData);
  //   alert('Form pre-filled with hardcoded mock data!');
  // }

  async pollReadResult(operationLocation: string): Promise<any> {
    let result;
    while (true) {
      const response = await axios.get(operationLocation, {
        headers: {
          'Ocp-Apim-Subscription-Key': this.azureApiKey,
        },
      });
      result = response.data;

      if (result.status === 'succeeded') {
        break;
      } else if (result.status === 'failed') {
        throw new Error('Text extraction failed.');
      }

      // Wait for a short period before polling again
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
    return result.analyzeResult.readResults;
  }

  parseExtractedText(readResults: any): any {
    // Extract lines of text from the OCR results
    const lines = readResults.flatMap((page: any) => page.lines.map((line: any) => line.text));
    console.log('Extracted Lines:', lines);

    // Map extracted lines to form fields based on their expected order
    const mappedData = {
      firstName: this.extractField(lines, 'First Name'),
      lastName: this.extractField(lines, 'Last Name'),
      dob: this.extractField(lines, 'Date of Birth'),
      address: this.extractField(lines, 'Address'),
      city: this.extractField(lines, 'City'),
      province: this.extractField(lines, 'Province'),
    };

    console.log('Mapped Data:', mappedData);
    return mappedData;
  }

  extractField(lines: string[], fieldName: string): string {
    // Find the line that starts with the field name and extract its value
    const fieldLine = lines.find((line) => line.startsWith(fieldName + ':'));
    return fieldLine ? fieldLine.split(':')[1].trim() : ''; // Extract the value after the colon
  }

  onSubmit(): void {
    if (this.form.valid) {
      console.log('Form submitted:', this.form.value);
      alert('Form submitted successfully!');
    } else {
      alert('Please fill out all required fields.');
    }
  }
}
