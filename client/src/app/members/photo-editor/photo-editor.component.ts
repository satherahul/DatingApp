import { Component, Input, OnInit } from '@angular/core';
import { FileUploader } from 'ng2-file-upload';
import { take } from 'rxjs/operators';
import { Member } from 'src/app/_models/member';
import { Photo } from 'src/app/_models/photo';
import { User } from 'src/app/_models/user';
import { AccountService } from 'src/app/_services/account.service';
import { MembersService } from 'src/app/_services/members.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-photo-editor',
  templateUrl: './photo-editor.component.html',
  styleUrls: ['./photo-editor.component.css']
})
export class PhotoEditorComponent implements OnInit {
  @Input() member: Member;
  uploader: FileUploader;
  hasBaseDropzoneOver=false;
  baseUrl = environment.apiUrl;
  user: User;
  constructor(private accountService: AccountService, private memberSerivce: MembersService) {
    this.accountService.currentUser$.pipe(take(1)).subscribe(user =>this.user = user );
   }

  ngOnInit(): void {
    this.initializeUploader();
  }
  fileOverBase(e: any) {
    this.hasBaseDropzoneOver = e;
  }
  setMainPhoto(photo: Photo) {
    this.memberSerivce.setMainPhoto(photo.id).subscribe(()=>{
    this.user.photoUrl = photo.url;
    this.accountService.setCurrentUser(this.user);
    this.member.photoUrl = photo.url;
    this.member.photos.forEach(p =>{
      if(p.isMain) p.isMain = false;
      if(p.id === photo.id) p.isMain = true;
    })
   } )
  }

  deletePhoto(photoId: number){
    this.memberSerivce.deletePhoto(photoId).subscribe(()=> {
      this.member.photos = this.member.photos.filter(x => x.id !== photoId);
    })
  }

  initializeUploader(){
    this.uploader = new FileUploader({
      url: this.baseUrl +'users/add-photo',
      authToken: 'Bearer ' + this.user.token,
      isHTML5: true,
      allowedFileType: ['image'],
      removeAfterUpload : true,
      maxFileSize: 10 * 1024 * 1024
    });
    this.uploader.onAfterAddingFile = (file) => {
      file.withCredentials = false;
    }
    this.uploader.onSuccessItem = (item,response, status, headers) => {
      if(response){
        const photo : Photo= JSON.parse(response); 
        this.member.photos.push(photo);
        if(photo.isMain){
          this.user.photoUrl = photo.url;
          this.member.photoUrl = photo.url;
          this.accountService.setCurrentUser(this.user)
        }
      }
    }
  }

}
