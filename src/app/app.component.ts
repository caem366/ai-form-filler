import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AppFormComponent } from "./app-form/app-form.component";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  imports: [AppFormComponent]
})
export class AppComponent {
  title = 'form-filler-app';
}
