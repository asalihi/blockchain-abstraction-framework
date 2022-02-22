import { ErrorHandler, Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';

@Injectable()
export class ApplicationErrorHandler implements ErrorHandler {

  constructor() { }


  handleError(error: Error | HttpErrorResponse) {
    // TODO: LOG ERROR
    console.log('Error intercepted in APPLICATION ERROR HANDLER');
    console.log(error);
  }

}
