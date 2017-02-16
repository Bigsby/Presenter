using Android.App;
using Android.Widget;
using Android.OS;
using BL.Library;

namespace AndroidApp
{
    [Activity(Label = "AndroidApp", MainLauncher = true, Icon = "@drawable/icon")]
    public class MainActivity : Activity
    {
        BLClass _bl;

        public MainActivity()
        {
            _bl = new BLClass();
        }

        protected override void OnCreate(Bundle bundle)
        {
            base.OnCreate(bundle);

            // Set our view from the "main" layout resource
            SetContentView(Resource.Layout.Main);
            var display = FindViewById<TextView>(Resource.Id.display);
            display.Text = _bl.ViewModel.Text;
        }
    }
}

